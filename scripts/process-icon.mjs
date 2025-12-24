import sharp from "sharp";
import fs from "fs";
import path from "path";

// Get source file path from command line args or use default
const sourcePath = process.argv[2] || "./assets/images/icon-new.png";
const outputPath = "./assets/images/icon.png";

console.log("Processing app icon...");
console.log(`Source: ${sourcePath}`);
console.log(`Output: ${outputPath}`);

// Check if source file exists
if (!fs.existsSync(sourcePath)) {
  console.error(`❌ Error: Source file not found at ${sourcePath}`);
  console.log("\nPlease place your new icon image file in the project root or specify the path:");
  console.log("  node scripts/process-icon.mjs path/to/your/image.png");
  console.log("\nOr place it at: ./assets/images/icon-new.png");
  process.exit(1);
}

try {
  // Read and process the image
  const img = sharp(sourcePath);
  const meta = await img.metadata();

  console.log(`\n📸 Original image metadata:`);
  console.log(`   Format: ${meta.format}`);
  console.log(`   Size: ${meta.width}x${meta.height}px`);
  console.log(`   Has alpha: ${meta.hasAlpha}`);

  // Process the image
  let processed = img;

  // Resize to 1024x1024 with cover fit (maintains aspect ratio, crops if needed)
  if (meta.width !== 1024 || meta.height !== 1024) {
    console.log(`\n🔄 Resizing to 1024x1024...`);
    processed = processed.resize(1024, 1024, { 
      fit: "cover", // Maintain aspect ratio, crop if necessary
      position: "center" 
    });
  }

  // Flatten to remove transparency with purple gradient background
  // Using brand colors: dark purple (#0B0B0B base) to purple gradient
  console.log(`\n🎨 Flattening image (removing transparency)...`);
  processed = processed.flatten({ 
    background: { 
      r: 75,   // #4B2A88 purple
      g: 42, 
      b: 136 
    } 
  });

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save the processed image
  console.log(`\n💾 Saving processed icon...`);
  await processed
    .png({ 
      compressionLevel: 9,
      quality: 100 
    })
    .toFile(outputPath);

  // Verify the output
  const outputMeta = await sharp(outputPath).metadata();
  console.log(`\n✅ Icon processed successfully!`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Size: ${outputMeta.width}x${outputMeta.height}px`);
  console.log(`   Format: ${outputMeta.format}`);
  console.log(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
  
  console.log(`\n📱 Next steps:`);
  console.log(`   1. The icon has been saved to: ${outputPath}`);
  console.log(`   2. Update app.json if needed (icon path should be "./assets/images/icon.png")`);
  console.log(`   3. Run: npx expo prebuild --clean`);
  console.log(`   4. Build: eas build --platform ios --profile production`);

} catch (error) {
  console.error(`\n❌ Error processing icon:`, error.message);
  process.exit(1);
}



