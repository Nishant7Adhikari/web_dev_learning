// js/exportImport.js

const exportImport = {
  async exportJourneys(journeys) {
    if (!journeys || journeys.length === 0) {
      alert("No journeys selected for export.");
      return;
    }

    const zip = new JSZip();

    for (const journey of journeys) {
      const journeyFolder = zip.folder(`journey_${journey.id}`);
      const nodesWithImages = [];
      const imageFiles = new Map();

      for (const node of journey.nodes) {
        const nodeCopy = { ...node };
        if (node.imageBlob) {
          const imageName = `image_${node.id}.png`;
          nodeCopy.imagePath = imageName;
          imageFiles.set(imageName, node.imageBlob);
          delete nodeCopy.imageBlob;
        }
        nodesWithImages.push(nodeCopy);
      }

      const journeyData = { ...journey, nodes: nodesWithImages };
      journeyFolder.file("journey.json", JSON.stringify(journeyData, null, 2));

      for (const [name, blob] of imageFiles.entries()) {
        journeyFolder.file(name, blob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-");
    const filename = `path-tracker-export-${timestamp}.prkt`;

    // DEFINITIVE BUGFIX: Wrap the zip blob in a generic octet-stream to force the filename.
    const downloadBlob = new Blob([zipBlob], { type: 'application/octet-stream' });
    
    this.triggerDownload(downloadBlob, filename);
  },

  async importJourneys(file) {
    const zip = await JSZip.loadAsync(file);
    const journeyPromises = [];

    zip.forEach((relativePath, zipEntry) => {
      if (relativePath.endsWith("journey.json")) {
        journeyPromises.push(
          (async () => {
            const journeyJson = await zipEntry.async("string");
            const journey = JSON.parse(journeyJson);

            const newJourneyId = await db.addJourney({
              name: journey.name,
              startTime: journey.startTime,
              endTime: journey.endTime,
            });

            for (const node of journey.nodes) {
              let imageBlob = null;
              if (node.imagePath) {
                const imageFile = zip.file(
                  relativePath.replace("journey.json", node.imagePath)
                );
                if (imageFile) {
                  imageBlob = await imageFile.async("blob");
                }
              }
              await db.addNode({
                journeyId: newJourneyId,
                name: node.name,
                latitude: node.latitude,
                longitude: node.longitude,
                altitude: node.altitude,
                timestamp: node.timestamp,
                imageBlob: imageBlob,
              });
            }
          })()
        );
      }
    });

    await Promise.all(journeyPromises);
  },

  triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};