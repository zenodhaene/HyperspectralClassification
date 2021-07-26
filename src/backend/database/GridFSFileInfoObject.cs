using MongoDB.Driver.GridFS;
using System;
using System.Collections.Generic;
using System.Text;

namespace database {
    public class GridFSFileInfoObject {

        public string Id { get; set; }
        public long Length { get; set; }
        public int ChunkSizeBytes { get; set; }
        public DateTime UploadDate { get; set; }
        public string Filename { get; set; }
        public object Metadata { get; set; }

        public GridFSFileInfoObject(GridFSFileInfo info) {
            Id = info.Id.ToString();
            Length = info.Length;
            ChunkSizeBytes = info.ChunkSizeBytes;
            UploadDate = info.UploadDateTime;
            Filename = info.Filename;
            Metadata = info.Metadata == null ? null : info.Metadata.ToDictionary();
        }
    }
}
