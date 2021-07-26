class ModelParameters:
    def __init__(self):
        self.parameters = []
    
    def add_slider(self, parameter_name, default_value, min_value=0, max_value=100, step=1):
        self.parameters.append({
            "parameter_type": "slider",
            "parameter_name": parameter_name,
            "default_value": default_value,
            "min_value": min_value,
            "max_value": max_value,
            "step": step
        })
    
    def add_parameter(self, parameter_name, default_value, min_value=0, max_value=100):
        self.parameters.append({
            "parameter_type": "parameter",
            "parameter_name": parameter_name,
            "default_value": default_value,
            "min_value": min_value,
            "max_value": max_value
        })
    
    def get_parameters(self):
        return self.parameters
    
    def get_parameters_initialized(self, parameter_obj):
        parameters = {}

        for param in self.parameters:
            parameters[param["parameter_name"]] = param["default_value"]
        
        for param in parameter_obj:
            if param["Name"] in parameters:
                parameters[param["Name"]] = param["Value"]
        
        return parameters