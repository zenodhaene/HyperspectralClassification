MONGODB = {
    "Host": "localhost",
    "Port": 27017,
    "Database": "Thesis"
}

ACCOUNTSTORE = {
    "Collection": "Accounts"
}

DATASETSTORE = {
    "Collection": "Datasets",
    "Bucket": "Datasets",
    "ChunkSizeBytes": 1048576,
}

MATLABDATASETSTORE = {
    "Collection": "MatlabDatasets"
}

MODELSTORE = {
    "Collection": "Models"
}

# https://sashamaps.net/docs/resources/20-colors/
DISTINCT_COLOR_LIST = [
    "#800000", # Maroon
    "#E6194B", # Red
    "#FABED4", # Pink
    "#9A6324", # Brown
    "#F58231", # Orange
    "#FFD8B1", # Apricot
    "#808000", # Olive
    "#FFe119", # Yellow
    "#FFFAC8", # Beige
    "#BFEF45", # Lime
    "#3CB44B", # Green
    "#AAFFC3", # Mint
    "#469990", # Teal
    "#42D4F4", # Cyan
    "#000075", # Navy
    "#4363D8", # Blue
    "#911EB4", # Purple
    "#DCBEFF", # Lavender
    "#F032E6", # Magenta
    "#A9A9A9", # Gray
]