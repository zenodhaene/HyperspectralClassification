using backend.Settings;
using Flurl;
using Flurl.Http;
using Newtonsoft.Json;
using System;
using System.Net.Http;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace backend.Services {
    public class PythonModelService {
        private readonly IPythonBackendSettings _configuration;
        private readonly HttpClient _httpClient;

        public PythonModelService(IPythonBackendSettings configuration, HttpClient httpClient) {
            _configuration = configuration;
            _httpClient = httpClient;
        }

        public async Task<DataDto> GetParametersForType(string type) {
            Url url = Url.Combine(
                _configuration.Url,
                _configuration.Routes.Model.Base,
                type,
                _configuration.Routes.Model.Parameters
            );

            return await url.GetJsonAsync<DataDto>();
        }

        public async Task<DataDto> GetModelTypes() {
            Url url = Url.Combine(
                _configuration.Url,
                _configuration.Routes.Model.Base
            );

            DataDto types = await url.GetJsonAsync<DataDto>();
            return types;
        }
    }

    public class DataDto {
        public dynamic[] Data { get; set; }
        public bool Success { get; set; }
    }
}
