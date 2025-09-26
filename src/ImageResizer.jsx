import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

// ImageResizer.jsx
// Single-file React component (Tailwind CSS classes used)
// Usage: drop this component into a React app that has Tailwind configured

export default function ImageResizer() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // resize options
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [percent, setPercent] = useState(100);
  const [usePercent, setUsePercent] = useState(false);
  const [keepAspect, setKeepAspect] = useState(true);
  const [quality, setQuality] = useState(0.9); // for JPEG
  const [format, setFormat] = useState("image/jpeg");

  // load image when file changes
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      if (!usePercent) {
        // set defaults to original when first loaded
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
      }
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // helper: draw resized image to canvas and return blob url
  const resizeToBlobUrl = async () => {
    if (!image || !canvasRef.current) return null;
    let targetW = width;
    let targetH = height;

    if (usePercent) {
      const factor = percent / 100;
      targetW = Math.round(image.naturalWidth * factor);
      targetH = Math.round(image.naturalHeight * factor);
    } else if (keepAspect) {
      // compute aspect-corrected height if only width changed by user
      const aspect = image.naturalWidth / image.naturalHeight;
      // if user edited width and height but keepAspect = true, prefer width
      targetH = Math.round(targetW / aspect);
    }

    const canvas = canvasRef.current;
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(image, 0, 0, targetW, targetH);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          const url = URL.createObjectURL(blob);
          resolve({ blob, url, width: targetW, height: targetH });
        },
        format,
        quality
      );
    });
  };

  const handleFile = (f) => {
    if (!f) return;
    // accept only images
    if (!f.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  };

  const handleResizeClick = async () => {
    const result = await resizeToBlobUrl();
    if (!result) return;
    // open result in new tab as preview
    window.open(result.url, "_blank");
  };

  const handleDownload = async () => {
    const result = await resizeToBlobUrl();
    if (!result) return;

    const a = document.createElement("a");
    a.href = result.url;
    // generate a nice filename
    const ext = format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg";
    a.download = `resized-${result.width}x${result.height}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // revoke object URL after a bit
    setTimeout(() => URL.revokeObjectURL(result.url), 2000);
  };

  const handleWidthChange = (v) => {
    const n = Number(v) || 0;
    setWidth(n);
    if (keepAspect && image) {
      const aspect = image.naturalWidth / image.naturalHeight;
      setHeight(Math.round(n / aspect));
    }
  };

  const handleHeightChange = (v) => {
    const n = Number(v) || 0;
    setHeight(n);
    if (keepAspect && image) {
      const aspect = image.naturalWidth / image.naturalHeight;
      setWidth(Math.round(n * aspect));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-6">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md p-6"
        >
          <h1 className="text-2xl font-semibold mb-2">Image Resizer</h1>
          <p className="text-sm text-gray-600 mb-4">
            Upload an image, choose output size or percentage, preview and download. Client-side only — your images never leave your browser.
          </p>

          {/* Upload / Drop area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex items-center gap-6"
          >
            <div className="flex-1">
              <p className="text-gray-700 mb-2">Drop an image here or</p>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Image
                </button>
                <button
                  className="px-4 py-2 rounded-md border hover:bg-gray-100"
                  onClick={() => {
                    // sample image (small placeholder) - optionally useful for quick testing
                    fetch("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='%23a0aec0'/><text x='50%' y='50%' font-size='40' text-anchor='middle' fill='white' dy='.3em'>Sample</text></svg>")
                      .then((r) => r.blob())
                      .then((b) => {
                        const f = new File([b], "sample.svg", { type: "image/svg+xml" });
                        handleFile(f);
                      });
                  }}
                >
                  Load Sample
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            {/* preview */}
            <div className="w-40 h-28 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="object-contain w-full h-full" />
              ) : (
                <div className="text-sm text-gray-400">No image</div>
              )}
            </div>
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded">
              <h3 className="font-medium mb-2">Output Size</h3>
              <div className="flex items-center gap-2 mb-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={usePercent} onChange={(e) => setUsePercent(e.target.checked)} />
                  Use percent
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={keepAspect} onChange={(e) => setKeepAspect(e.target.checked)} />
                  Keep aspect ratio
                </label>
              </div>

              {usePercent ? (
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={200}
                    value={percent}
                    onChange={(e) => setPercent(Number(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-16 text-right">{percent}%</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Width (px)</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className="w-full mt-1 p-2 rounded border"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Height (px)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className="w-full mt-1 p-2 rounded border"
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="text-xs text-gray-500">Format</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full mt-1 p-2 rounded border">
                  <option value="image/jpeg">JPEG (good compression)</option>
                  <option value="image/png">PNG (lossless)</option>
                  <option value="image/webp">WebP (small files)</option>
                </select>
              </div>

              <div className="mt-3">
                <label className="text-xs text-gray-500">Quality (JPEG/WebP)</label>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-600">{Math.round(quality * 100)}%</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-medium mb-2">Actions</h3>
              <div className="flex flex-col gap-2">
                <button onClick={handleResizeClick} className="w-full px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500">
                  Preview Resized (opens new tab)
                </button>
                <button onClick={handleDownload} className="w-full px-4 py-2 rounded border">
                  Download
                </button>
                <button
                  onClick={() => {
                    setFile(null);
                    setImage(null);
                    setPreviewUrl(null);
                  }}
                  className="w-full px-4 py-2 rounded bg-gray-100"
                >
                  Clear
                </button>

                <div className="mt-2 text-xs text-gray-500">
                  Tip: drag & drop or click "Choose Image". Everything runs locally in your browser.
                </div>
              </div>
            </div>
          </div>

          {/* previews */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-white p-4 rounded shadow-sm">
              <h4 className="font-medium mb-2">Original</h4>
              <div className="h-64 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="orig" className="object-contain w-full h-full" />
                ) : (
                  <div className="text-gray-400">No image loaded</div>
                )}
              </div>
              {image && (
                <div className="mt-2 text-xs text-gray-500">Original: {image.naturalWidth} × {image.naturalHeight}</div>
              )}
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
              <h4 className="font-medium mb-2">Resized Preview</h4>
              <div className="h-64 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                <canvas ref={canvasRef} className="max-w-full max-h-full" />
                {!image && <div className="text-gray-400">Will draw here after preview/download</div>}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Output size: {usePercent ? `${percent}%` : `${width} × ${height}`}
              </div>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-500">Made with ❤️ — client-side only. Works offline once loaded.</div>
        </motion.div>
      </div>
    </div>
  );
}
