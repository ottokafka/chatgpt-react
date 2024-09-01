import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiDownload, FiX, FiMessageSquare, FiMenu, FiArrowLeft } from 'react-icons/fi';
import { SlOptions } from 'react-icons/sl';
import { useImageContext } from '../utils/ImageContext';

const ImageSidebar = ({ isOpen, toggleSidebar }) => {
    const { images, loadImagesFromIndexedDB, deleteImage } = useImageContext();
    const [selectedImage, setSelectedImage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadImagesFromIndexedDB();
    }, [loadImagesFromIndexedDB]);

    const handleImageClick = (image) => {
        setSelectedImage(image);
    };

    const closeFullImage = () => {
        setSelectedImage(null);
    };

    const downloadImage = (image, e) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${image.base64}`;
        link.download = `generated_image_${image.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBackClick = () => {
        navigate('/');
    };

    return (
        <>
            <div className={`w-80 h-screen bg-gray-900 text-white p-4 flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} fixed top-0 left-0 z-20`}>
                <div className="flex justify-between items-center mb-4">
                    <button
                        className="text-white p-2 rounded-full hover:bg-gray-800"
                        onClick={handleBackClick}
                    >
                        <FiArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-bold">Image History</h2>
                    <button
                        className="text-white p-2 rounded-full hover:bg-gray-800"
                        onClick={toggleSidebar}
                    >
                        <FiX size={24} />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {images.map((image) => (
                        <div
                            key={image.id}
                            className="mb-4 relative group cursor-pointer"
                            onClick={() => handleImageClick(image)}
                        >
                            <img
                                src={`data:image/png;base64,${image.base64}`}
                                alt={image.prompt}
                                className="w-full h-auto rounded"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteImage(image.id);
                                    }}
                                    className="text-white bg-red-500 p-2 rounded-full mr-2"
                                >
                                    <FiTrash2 />
                                </button>
                                <button
                                    onClick={(e) => downloadImage(image, e)}
                                    className="text-white bg-green-500 p-2 rounded-full"
                                >
                                    <FiDownload />
                                </button>
                            </div>
                            <p className="text-sm mt-1 truncate">{image.prompt}</p>
                        </div>
                    ))}
                </div>
            </div>
            {!isOpen && (
                <button
                    className="fixed top-4 left-4 text-white bg-gray-900 p-2 rounded-full z-10"
                    onClick={toggleSidebar}
                >
                    <FiMenu size={24} />
                </button>
            )}
            {selectedImage && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="relative max-w-4xl max-h-screen">
                        <img
                            src={`data:image/png;base64,${selectedImage.base64}`}
                            alt={selectedImage.prompt}
                            className="max-w-full max-h-screen"
                        />
                        <button
                            onClick={closeFullImage}
                            className="absolute top-4 right-4 text-white bg-black p-2 rounded-full"
                        >
                            <FiX />
                        </button>
                        <button
                            onClick={(e) => downloadImage(selectedImage, e)}
                            className="absolute bottom-4 right-4 text-white bg-green-500 p-2 rounded-full"
                        >
                            <FiDownload />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ImageSidebar;