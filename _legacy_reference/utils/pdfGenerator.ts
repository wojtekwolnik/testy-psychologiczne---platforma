import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePdf = (elementId: string, fileName: string): void => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  // Add a class to temporarily hide elements not meant for PDF
  document.body.classList.add('pdf-generating');

  html2canvas(input, { 
    scale: 2, // Increase scale for better quality
    logging: false,
    useCORS: true, 
    onclone: (document) => {
        // Find elements to hide in the clone and remove them
        const elementsToHide = document.querySelectorAll('.hide-on-pdf');
        elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
    }
  })
    .then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;

      const imgWidth = pdfWidth - 20; // with margin
      const imgHeight = imgWidth / ratio;
      
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }
      
      pdf.save(`${fileName}.pdf`);
      document.body.classList.remove('pdf-generating');
    }).catch(err => {
        console.error("Error generating PDF:", err);
        document.body.classList.remove('pdf-generating');
    });
};
