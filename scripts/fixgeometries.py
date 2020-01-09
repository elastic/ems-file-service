"""
Small script to fix geometries of the first file argument
using the native QGIS processing algorithm. You may need
to adjust the path to you installation.
"""

from qgis.analysis import QgsNativeAlgorithms
from qgis.core import (
    QgsApplication,
    QgsProcessingFeedback,
    QgsVectorLayer
)

import sys
import processing
from processing.core.Processing import Processing


print("Initializing QGIS...")
qgs = QgsApplication([], False)
qgs.initQgis()
Processing.initialize()
QgsApplication.processingRegistry().addProvider(QgsNativeAlgorithms())


# Getting the file paths
in_file = sys.argv[1]
out_file = sys.argv[2]

# Running the algorithm
params = {
    'INPUT': QgsVectorLayer(in_file, 'layer1', 'ogr'),
    'OUTPUT': out_file
}
feedback = QgsProcessingFeedback()

print("Running the fix geometries algorithm...")
res = processing.run("native:fixgeometries", params, feedback=feedback)

print("Done!")
