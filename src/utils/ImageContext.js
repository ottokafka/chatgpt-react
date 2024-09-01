import React, { createContext, useState, useContext, useCallback } from 'react';

const ImageContext = createContext();

export const useImageContext = () => useContext(ImageContext);

export const ImageProvider = ({ children }) => {
    const [images, setImages] = useState([]);

    const loadImagesFromIndexedDB = useCallback(() => {
        const request = indexedDB.open('ImageDB', 1);

        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.error);
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['images'], 'readonly');
            const objectStore = transaction.objectStore('images');
            const getAllRequest = objectStore.getAll();

            getAllRequest.onsuccess = (event) => {
                setImages(event.target.result);
            };
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
        };
    }, []);

    const addImage = useCallback((newImage) => {
        setImages(prevImages => [...prevImages, newImage]);
    }, []);

    const deleteImage = useCallback((id) => {
        const request = indexedDB.open('ImageDB', 1);

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['images'], 'readwrite');
            const objectStore = transaction.objectStore('images');
            const deleteRequest = objectStore.delete(id);

            deleteRequest.onsuccess = () => {
                setImages(prevImages => prevImages.filter(image => image.id !== id));
            };
        };
    }, []);

    return (
        <ImageContext.Provider value={{ images, loadImagesFromIndexedDB, addImage, deleteImage }}>
            {children}
        </ImageContext.Provider>
    );
};