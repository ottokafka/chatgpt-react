import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiDownload, FiArrowLeft, FiMenu } from 'react-icons/fi';
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

    const closeFullImage = useCallback(() => {
        setSelectedImage(null);
    }, []);

    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            closeFullImage();
        }
    }, [closeFullImage]);

    useEffect(() => {
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                closeFullImage();
            }
        };

        if (selectedImage) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [selectedImage, closeFullImage]);

    const downloadImage = (image, e) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${image.base64}`;
        link.download = `generated_image_${image.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDeleteImage = (imageId, e) => {
        e.stopPropagation();
        deleteImage(imageId);
        if (selectedImage && selectedImage.id === imageId) {
            closeFullImage();
        }
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
                        <FiMenu size={24} />
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
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-2 right-2 flex">
                                    <button
                                        onClick={(e) => handleDeleteImage(image.id, e)}
                                        className="text-white bg-red-500 p-1 rounded-full mr-4"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => downloadImage(image, e)}
                                        className="text-white bg-green-500 p-1 rounded-full"
                                    >
                                        <FiDownload size={16} />
                                    </button>
                                </div>
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
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                    onClick={handleOverlayClick}
                >
                    <div className="relative max-w-4xl max-h-screen">
                        <img
                            src={`data:image/png;base64,${selectedImage.base64}`}
                            alt={selectedImage.prompt}
                            className="max-w-full max-h-screen"
                        />
                        <div className="absolute bottom-4 right-4 flex">
                            <button
                                onClick={(e) => handleDeleteImage(selectedImage.id, e)}
                                className="text-white bg-red-500 p-2 rounded-full mr-2"
                            >
                                <FiTrash2 size={24} />
                            </button>
                            <button
                                onClick={(e) => downloadImage(selectedImage, e)}
                                className="text-white bg-green-500 p-2 rounded-full"
                            >
                                <FiDownload size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ImageSidebar;