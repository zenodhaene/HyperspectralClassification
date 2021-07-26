using backend.Dto;
using backend.Settings;
using database.Enums;
using database.Models;
using database.Services;
using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace backend.Services {
    public class PythonDatasetService {

        private readonly IPythonBackendSettings _configuration;
        private readonly DatasetService _datasetService;
        private readonly MatlabDatasetService _matlabDatasetService;

        public PythonDatasetService(IPythonBackendSettings configuration, DatasetService datasetService, MatlabDatasetService matlabDatasetService) {
            _configuration = configuration;
            _datasetService = datasetService;
            _matlabDatasetService = matlabDatasetService;
        }

        public async Task<object> Validate(string id) {
            Dataset dataset = _datasetService.Get(id);

            string typeUrl = GetDatafileTypeUrl(dataset.DatafileType, _configuration.Routes.Dataset.Validate);

            Url url = Url.Combine(
                _configuration.Url,
                _configuration.Routes.Dataset.Base,
                typeUrl,
                "?id=" + dataset.File
            );

            switch(dataset.DatafileType) {
                case DatafileType.MATLAB:
                    return await ValidateMatlabDataset(url, dataset.Id);
                case DatafileType.EO1:
                    return await ValidateEO1Dataset(url, dataset.Id);
                default:
                    return null;
            }
        }

        public async Task<object> ValidateGroundTruth(string id) {
            Dataset dataset = _datasetService.Get(id);

            string typeUrl = GetDatafileTypeUrl(dataset.DatafileType, _configuration.Routes.Dataset.ValidateGroundTruth);

            Url url = Url.Combine(
                _configuration.Url,
                _configuration.Routes.Dataset.Base,
                typeUrl,
                "?id=" + dataset.Id
            );

            switch(dataset.DatafileType) {
                case DatafileType.MATLAB:
                    return await ValidateMatlabGroundTruth(url, dataset.Id);
                default:
                    return null;
            }
        }

        public async Task<string> GetLayer(string datasetId, int layer) {
            Dataset dataset = _datasetService.Get(datasetId);

            if (dataset == null) return null;

            string typeUrl = Url.Combine(GetDatafileTypeUrl(dataset.DatafileType, _configuration.Routes.Dataset.Layer));
            Url url = Url.Combine(
                _configuration.Url,
                _configuration.Routes.Dataset.Base,
                typeUrl,
                "?id=" + datasetId,
                "&layer=" + layer,
                "&normalized=false"
            );

            return await url.GetStringAsync();
        }

        public async Task<string> GenerateThumbnail(string datasetId, int layer) {
            Dataset dataset = _datasetService.Get(datasetId);
            if (dataset == null) return null;

            string typeUrl = Url.Combine(GetDatafileTypeUrl(dataset.DatafileType, _configuration.Routes.Dataset.GenerateThumbnail));
            Url url = Url.Combine(
                _configuration.Url,
                _configuration.Routes.Dataset.Base,
                typeUrl,
                "?id=" + datasetId,
                "&layer=" + layer
            );

            return await url.GetStringAsync();
        }

        public async Task<string> GenerateGroundTruthImage(string datasetId) {
            Dataset dataset = _datasetService.Get(datasetId);
            if (dataset == null || dataset.GroundTruth == null) return null;

            string typeUrl = Url.Combine(GetDatafileTypeUrl(dataset.DatafileType, _configuration.Routes.Dataset.GenerateGroundTruthImage));
            Url url = Url.Combine(
                _configuration.Url,
                _configuration.Routes.Dataset.Base,
                typeUrl,
                "?id=" + datasetId
            );

            return await url.GetStringAsync();
        }

        private async Task<ValidateDatasetMatlabDto> ValidateMatlabDataset(string url, string datasetId) {
            ValidateDatasetMatlabDto result = await url.GetJsonAsync<ValidateDatasetMatlabDto>();

            if (result.Success) {
                _matlabDatasetService.CreateOrUpdate(new MatlabDataset {
                    Dataset = datasetId,
                    KeyInDatafile = result.DatakeyInFile
                });

                Dataset dataset = _datasetService.Get(datasetId);

                dataset.Dimension = result.Dimension;
                dataset.NSpectralBands = result.NSpectralBands;
                dataset.Valid = true;

                _datasetService.Update(datasetId, dataset);
            }

            return result;
        }

        private async Task<ValidateDatasetEO1Dto> ValidateEO1Dataset(string url, string datasetId) {
            ValidateDatasetEO1Dto result = await url.GetJsonAsync<ValidateDatasetEO1Dto>();

            if (result.Success) {
                Dataset dataset = _datasetService.Get(datasetId);
                dataset.Dimension = result.Dimension;
                dataset.NSpectralBands = result.NSpectralBands;
                dataset.Valid = true;

                _datasetService.Update(datasetId, dataset);
            }

            return result;
        }

        private async Task<ValidateGroundTruthMatlabDto> ValidateMatlabGroundTruth(string url, string datasetId) {
            ValidateGroundTruthMatlabDto result = await url.GetJsonAsync<ValidateGroundTruthMatlabDto>();

            if (!result.Success) {
                Dataset dataset = _datasetService.Get(datasetId);

                dataset.GroundTruth = null;

                _datasetService.Update(datasetId, dataset);
            }

            return result;
        }

        private string GetDatafileTypeUrl(DatafileType type, string postfix) {
            string baseUrl;
            switch (type) {
                case DatafileType.MATLAB:
                    baseUrl = _configuration.Routes.Dataset.Matlab.Base;
                    break;
                case DatafileType.EO1:
                    baseUrl = _configuration.Routes.Dataset.EO1.Base;
                    break;
                default:
                    return null;
            }

            if (postfix == null) return new Url(baseUrl);

            return Url.Combine(baseUrl, postfix);
        }
    }
}
