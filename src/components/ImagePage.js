import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ImageGenerator = () => {
    const [base64Image, setBase64Image] = useState('');
    const [prompt, setPrompt] = useState("High quality photo of an astronaut riding a horse in space");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSize, setSelectedSize] = useState('medium');

    const generateImage = async () => {
        setIsLoading(true);

        let size = '512x512'; // Default size for medium

        switch (selectedSize) {
            case 'small':
                size = '264x264';
                break;
            case 'medium':
                size = '512x512';
                break;
            case 'large':
                size = '1024x1024';
                break;
        }

        try {
            const response = await axios.post('/api/imageGen', {
                prompt: prompt,
                size: size,
            });

            if (response.status === 200) {
                setBase64Image(response.data.data[0].b64_json);
            } else {
                console.error('Request failed with status:', response.status);
            }
        } catch (error) {
            console.error('Error generating image:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadImage = () => {
        const bytes = atob(base64Image);
        const blob = new Blob([new Uint8Array([...bytes].map(char => char.charCodeAt(0)))], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'generated_image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const buildSizeOption = (size) => (
        <label key={size}>
            <input
                type="radio"
                value={size}
                checked={selectedSize === size}
                onChange={(e) => setSelectedSize(e.target.value)}
            />
            {size}
        </label>
    );

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Image Generator</h1>
            <div className="mb-4 flex-1 flex items-center justify-center">
                {isLoading ? (
                    <div className="loader">Loading...</div>
                ) : base64Image ? (
                    <div className="relative">
                        <img src={`data:image/png;base64,${base64Image}`} alt="Generated" className="max-w-full h-auto" />
                        <button
                            onClick={downloadImage}
                            className="absolute bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full"
                        >
                            Download
                        </button>
                    </div>
                ) : (
                    <p>Write a prompt & click generate ... Magic</p>
                )}
            </div>
            <div className="flex mb-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 p-2 border rounded-l"
                    placeholder="Enter your prompt"
                />
                <button
                    onClick={generateImage}
                    disabled={isLoading}
                    className="bg-blue-500 text-white p-2 rounded-r"
                >
                    Generate
                </button>
            </div>
            <div className="flex justify-center space-x-4">
                {['small', 'medium', 'large'].map(buildSizeOption)}
            </div>
        </div>
    );
};

export default ImageGenerator;