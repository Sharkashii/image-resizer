import { useState } from "react";
import "./App.css";

function App() {
  const [image, setImage] = useState<File | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(300);
  const [height, setHeight] = useState<number>(300);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImage(e.target.files[0]);
  };

  const resizeImage = () => {
    if (!image) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0, width, height);
        setResizedImage(canvas.toDataURL("image/png"));
      };
      if (event.target?.result) img.src = event.target.result as string;
    };
    reader.readAsDataURL(image);
  };

  return (
    <div className="container">
      <div className="content">
        <h1>Image Resizer</h1>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <div className="inputs">
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            placeholder="Width"
          />
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            placeholder="Height"
          />
        </div>
        <button onClick={resizeImage}>Resize</button>
        {resizedImage && (
          <div>
            <h3>Resized Image:</h3>
            <img className="resized" src={resizedImage} alt="Resized" />
            <br />
            <a href={resizedImage} download="resized.png">
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
