import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FileContextType {
    currentText: string;
    setCurrentText: (text: string) => void;
    fileName: string;
    setFileName: (name: string) => void;
    lastAnalysis: any;
    setLastAnalysis: (data: any) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: ReactNode }) {
    const [currentText, setCurrentText] = useState('');
    const [fileName, setFileName] = useState('');
    const [lastAnalysis, setLastAnalysis] = useState<any>(null);

    return (
        <FileContext.Provider
            value={{
                currentText,
                setCurrentText,
                fileName,
                setFileName,
                lastAnalysis,
                setLastAnalysis
            }}
        >
            {children}
        </FileContext.Provider>
    );
}

export function useFileContext() {
    const context = useContext(FileContext);
    if (context === undefined) {
        throw new Error('useFileContext must be used within a FileProvider');
    }
    return context;
}
