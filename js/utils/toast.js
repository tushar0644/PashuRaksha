window.showToast = function(message, type = 'success') {
  let bgColor = "linear-gradient(to right, #10b981, #059669)"; // Emerald
  if (type === 'error') {
    bgColor = "linear-gradient(to right, #ef4444, #dc2626)"; // Red
  } else if (type === 'warning') {
    bgColor = "linear-gradient(to right, #f59e0b, #d97706)"; // Amber
  }

  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top", 
    position: "right",
    stopOnFocus: true, 
    style: {
      background: bgColor,
      borderRadius: "8px",
      fontFamily: "'Inter', sans-serif",
      fontSize: "14px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    }
  }).showToast();
};
