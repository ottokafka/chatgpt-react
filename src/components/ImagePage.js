import React, { useState } from 'react';
import axios from 'axios';
import { useImageContext } from '../utils/ImageContext';
import ImageSidebar from './ImageSidebar';
import { RiSendPlane2Fill } from 'react-icons/ri';
import { FiDownload } from 'react-icons/fi'

const ImagePage = () => {
    const [base64Image, setBase64Image] = useState('');
    const [prompt, setPrompt] = useState("Mario and Luigi in a battle with Pikachu.");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSize, setSelectedSize] = useState('medium');
    const { addImage } = useImageContext();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

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
            const response = await axios.post('http://localhost:4445/generate-image', {
                prompt: prompt,
                size: size,
            });

            if (response.status === 200) {
                const imageData = response.data.data[0].b64_json;
                setBase64Image(imageData);
                saveImageToIndexedDB(imageData);
            } else {
                console.error('Request failed with status:', response.status);
            }
        } catch (error) {
            console.error('Error generating image:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveImageToIndexedDB = (imageData) => {
        const request = indexedDB.open('ImageDB', 1);

        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.error);
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['images'], 'readwrite');
            const objectStore = transaction.objectStore('images');
            const addRequest = objectStore.add({ base64: imageData, prompt: prompt });

            addRequest.onsuccess = (event) => {
                console.log("Image saved to IndexedDB");
                addImage({ id: event.target.result, base64: imageData, prompt: prompt });
            };
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
        };
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
        <label key={size} className="inline-flex items-center mr-4">
            <input
                type="radio"
                value={size}
                checked={selectedSize === size}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-gray-300">{size}</span>
        </label>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-900 md:flex-row">
            <ImageSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'md:ml-80' : 'md:ml-0'}`}>
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="mb-6 flex flex-col items-center justify-center">
                        {isLoading ? (
                            <div className="loader text-white">Loading...</div>
                        ) : base64Image ? (
                            <>
                                <img src={`data:image/png;base64,${base64Image}`} alt="Generated" className="max-w-full h-auto mb-4 rounded-lg shadow-lg" />
                                <button
                                    onClick={downloadImage}
                                    className="bg-green-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
                                >
                                    <FiDownload size={24} />
                                </button>
                            </>
                        ) : (
                            <p className="text-gray-300">Write a prompt & click generate ... Magic</p>
                        )}
                    </div>
                </div>
                <div className="p-4 md:p-6">
                    <div className="flex flex-col max-w-3xl mx-auto">
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full p-2 border border-gray-700 rounded-lg bg-gray-800 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your prompt"
                                rows={3}
                            />
                            <button
                                onClick={generateImage}
                                disabled={isLoading}
                                className="absolute right-2 top-2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <RiSendPlane2Fill size={24} />
                            </button>
                        </div>
                        <div className="flex justify-center p-2 flex-wrap">
                            {['small', 'medium', 'large'].map(buildSizeOption)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImagePage;