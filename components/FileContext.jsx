import React, { createContext, useContext, useState } from 'react';

export const FileContext = createContext({
  files: [],
  setFiles: () => {}
});

export const useFiles = () => {
  return useContext(FileContext);
}

export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([]);

  return (
    <FileContext.Provider value={{ files, setFiles }}>
      {children}
    </FileContext.Provider>
  );
}
