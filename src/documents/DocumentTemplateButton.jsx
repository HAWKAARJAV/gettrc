import { useState } from "react";
import { getDocumentTemplateUrl } from "./documentTemplates";

// An "eye" icon shown next to a document row. Clicking it opens a lightbox
// with the example/template image for that exact document name (see
// documentTemplates.js for how the image path is resolved). If no image has
// been uploaded yet for this name, the modal says so instead of showing a
// broken image.
export default function DocumentTemplateButton({ documentName, size = 30 }) {
  const [open, setOpen] = useState(false);
  const [missing, setMissing] = useState(false);
  const url = getDocumentTemplateUrl(documentName);
  if (!url) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`View example: ${documentName}`}
        style={{
          width: size, height: size, borderRadius: 8, border: "1px solid #E2E8F0",
          background: "#F7F8FC", color: "#0F2557", display: "inline-flex",
          alignItems: "center", justifyContent: "center", cursor: "pointer",
          flexShrink: 0, fontSize: 15, padding: 0,
        }}
      >
        👁
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,37,87,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, padding: 20, maxWidth: 560, width: "100%", boxShadow: "0 12px 48px rgba(15,37,87,.25)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#0F2557" }}>Example: {documentName}</div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6B7A99" }}>×</button>
            </div>
            {missing ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#6B7A99", fontSize: 13, background: "#F7F8FC", borderRadius: 10 }}>
                No example image has been uploaded for this document yet.
              </div>
            ) : (
              <img
                src={url}
                alt={`Example ${documentName}`}
                onError={() => setMissing(true)}
                style={{ width: "100%", borderRadius: 10, display: "block", border: "1px solid #E2E8F0" }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
