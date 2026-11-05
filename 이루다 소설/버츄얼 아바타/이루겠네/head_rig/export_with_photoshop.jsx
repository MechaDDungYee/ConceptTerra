#target photoshop

// Run in Photoshop: File > Scripts > Browse. Each PNG already shares one canvas.
(function () {
    var root = File($.fileName).parent;
    var out = File(root.fsName + "/이루겠네_머리중심_원화_Photoshop.psd");
    var report = File(root.fsName + "/photoshop_export_status.txt");
    var originalDialogs = app.displayDialogs;
    var layers = [
        ["back_hair", true],
        ["face_blank", true],
        ["face_neck_reference", false],
        ["body", true],
        ["eyes_open", true],
        ["eyes_closed", false],
        ["mouth_closed", true],
        ["mouth_open", false],
        ["front_hair", true]
    ];
    try {
        app.displayDialogs = DialogModes.NO;
        var doc = app.documents.add(1024, 1536, 72, "이루겠네 머리 중심 원화", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
        for (var i = 0; i < layers.length; i++) {
            var png = File(root.fsName + "/layers/" + layers[i][0] + ".png");
            if (!png.exists) throw new Error("Missing layer: " + png.fsName);
            var source = app.open(png);
            var targetLayer = source.activeLayer.duplicate(doc, ElementPlacement.PLACEATBEGINNING);
            source.close(SaveOptions.DONOTSAVECHANGES);
            app.activeDocument = doc;
            targetLayer.name = layers[i][0];
            targetLayer.visible = layers[i][1];
        }
        try {
            if (doc.colorProfileName !== "sRGB IEC61966-2.1") {
                doc.convertProfile("sRGB IEC61966-2.1", Intent.RELATIVECOLORIMETRIC, true, true);
            }
        } catch (profileError) {
            // Photoshop's working RGB profile remains usable if conversion is unavailable.
        }
        var options = new PhotoshopSaveOptions();
        options.layers = true;
        options.embedColorProfile = true;
        options.maximizeCompatibility = true;
        doc.saveAs(out, options, true, Extension.LOWERCASE);
        report.open("w");
        report.write("OK: " + out.fsName);
        report.close();
    } catch (error) {
        report.open("w");
        report.write("ERROR: " + error.toString());
        report.close();
        alert("PSD export failed: " + error.toString());
    } finally {
        app.displayDialogs = originalDialogs;
    }
})();
