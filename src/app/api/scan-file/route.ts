import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import AdmZip from "adm-zip";
import { scanFileWithVT } from "@/lib/virustotal";
import { ThreatReport, ArchiveScanGroup } from "@/types/threat";

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".zip",
  ".doc",
  ".docx",
  ".exe",
  ".js",
  ".txt",
]);

const MAX_FILE_SIZE = 32 * 1024 * 1024; // 32MB standard VirusTotal public upload limit
const MAX_EXTRACTED_FILES = 50; // Zip-bomb protection
const MAX_TOTAL_UNCOMPRESSED_SIZE = 200 * 1024 * 1024; // 200MB zip-bomb limit
const MAX_SINGLE_FILE_UNCOMPRESSED_SIZE = 20 * 1024 * 1024; // 20MB per entry

export async function POST(request: NextRequest) {
  let tempDirPath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in the upload payload." },
        { status: 400 }
      );
    }

    // 1. File Size Validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size (${(file.size / (1024 * 1024)).toFixed(
            1
          )}MB) exceeds the maximum allowed upload limit of 32MB.`,
        },
        { status: 400 }
      );
    }

    // 2. Extension Validation
    const originalName = file.name || "unnamed_file";
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `File extension '${ext}' is not permitted. Allowed extensions: ${Array.from(
            ALLOWED_EXTENSIONS
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 3. Staging in secure temp directory with randomly generated filename
    const randomDirId = `nexussec-scan-${crypto.randomUUID()}`;
    tempDirPath = path.join(os.tmpdir(), randomDirId);
    fs.mkdirSync(tempDirPath, { recursive: true });

    const safeTempFileName = `${crypto.randomUUID()}${ext}`;
    const uploadedFilePath = path.join(tempDirPath, safeTempFileName);

    // Stream / write buffer to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(uploadedFilePath, buffer);

    const isZip = ext === ".zip";

    // 4. Standalone file scan (non-ZIP)
    if (!isZip) {
      const report = await scanFileWithVT({
        filePath: uploadedFilePath,
        fileName: originalName,
        fileSize: file.size,
      });

      return NextResponse.json({
        success: true,
        isArchive: false,
        reports: [report],
      });
    }

    // 5. ZIP Archive Processing with strict Zip-Slip & Zip-Bomb protections
    const extractionSubdir = path.join(tempDirPath, "extracted");
    fs.mkdirSync(extractionSubdir, { recursive: true });

    let zip: AdmZip;
    try {
      zip = new AdmZip(uploadedFilePath);
    } catch (zipErr) {
      return NextResponse.json(
        { error: "Failed to decompress archive. File may be corrupted or invalid ZIP." },
        { status: 400 }
      );
    }

    const entries = zip.getEntries();
    let totalUncompressedSize = 0;
    let extractedFileCount = 0;
    const filesToScan: Array<{ path: string; name: string; size: number }> = [];

    // Pre-validation pass for Zip-Slip & Zip-Bomb caps
    for (const entry of entries) {
      if (entry.isDirectory) continue;

      extractedFileCount++;
      if (extractedFileCount > MAX_EXTRACTED_FILES) {
        return NextResponse.json(
          {
            error: `Zip bomb protection triggered: Archive contains more than ${MAX_EXTRACTED_FILES} files.`,
          },
          { status: 400 }
        );
      }

      const uncompressedSize = entry.header.size;
      if (uncompressedSize > MAX_SINGLE_FILE_UNCOMPRESSED_SIZE) {
        return NextResponse.json(
          {
            error: `Zip bomb protection triggered: File '${entry.entryName}' exceeds individual entry cap of 20MB.`,
          },
          { status: 400 }
        );
      }

      totalUncompressedSize += uncompressedSize;
      if (totalUncompressedSize > MAX_TOTAL_UNCOMPRESSED_SIZE) {
        return NextResponse.json(
          {
            error: `Zip bomb protection triggered: Total uncompressed archive size exceeds 200MB limit.`,
          },
          { status: 400 }
        );
      }

      // Zip-Slip Path Traversal Protection:
      // Verify resolved path strictly resides inside extractionSubdir
      const normalizedEntryPath = path.normalize(entry.entryName).replace(/^(\.\.[\/\\])+/, "");
      const resolvedDestination = path.resolve(extractionSubdir, normalizedEntryPath);
      const relative = path.relative(extractionSubdir, resolvedDestination);

      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return NextResponse.json(
          {
            error: `Zip-Slip security alert: Directory traversal attempt detected in entry '${entry.entryName}'. Extraction rejected.`,
          },
          { status: 400 }
        );
      }

      // Safe extraction to disk
      const targetDir = path.dirname(resolvedDestination);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(resolvedDestination, entry.getData());

      filesToScan.push({
        path: resolvedDestination,
        name: path.basename(entry.entryName),
        size: uncompressedSize,
      });
    }

    if (filesToScan.length === 0) {
      return NextResponse.json(
        { error: "Archive contains no extractable files." },
        { status: 400 }
      );
    }

    // Sequentially scan each extracted file through the shared VT queue
    const reports: ThreatReport[] = [];
    for (const item of filesToScan) {
      const rep = await scanFileWithVT({
        filePath: item.path,
        fileName: item.name,
        fileSize: item.size,
        parentArchive: originalName,
      });
      reports.push(rep);
    }

    const archiveGroup: ArchiveScanGroup = {
      archiveName: originalName,
      archiveSize: file.size,
      totalFiles: entries.length,
      extractedCount: filesToScan.length,
      reports,
      status: "Complete",
    };

    return NextResponse.json({
      success: true,
      isArchive: true,
      archiveGroup,
      reports,
    });
  } catch (error: any) {
    console.error("Scan-file error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error while processing upload." },
      { status: 500 }
    );
  } finally {
    // 6. Zero Persistence Disk Hygiene:
    // Purge temp directory & all extracted contents
    if (tempDirPath && fs.existsSync(tempDirPath)) {
      try {
        fs.rmSync(tempDirPath, { recursive: true, force: true });
      } catch (rmErr) {
        console.error("Error purging temp upload directory:", rmErr);
      }
    }
  }
}
