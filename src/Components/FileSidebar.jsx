import React from "react";
import { Trash } from "lucide-react";

const FileSidebar = ({
  files,
  activeFileId,
  onCreateFile,
  onSelectFile,
  onDeleteFile,
}) => {
  return (
    <div className="col-2 p-0 file-sidebar">
      <div className="file-header">
        <span>FILES</span>
        <button className="add-file-btn" onClick={onCreateFile}>
          ＋
        </button>
      </div>

      <div className="file-list">
        {files.map((file) => (
          <div
            key={file.id}
            className={`file-item ${
              file.id === activeFileId ? "active" : ""
            }`}
            onClick={() => onSelectFile(file.id)}
          >
            <div className="file-name">
              {file.name}
              <span className="file-user"> — {file.createdBy}</span>
            </div>

            <Trash
              size={16}
              className="delete-icon"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(file.id);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileSidebar;
