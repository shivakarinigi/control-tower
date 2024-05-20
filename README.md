# AWS Control Tower Baseline Management to Register existing OU to Control Tower.

This project contains an AWS Lambda function designed to manage baselines in AWS Control Tower. The function lists, checks, and enables specific baselines for an Organizational Unit (OU).

## Detailed Explanation of Each Step in the code

### List Identity Center Baseline ARN:
- Uses `ListBaselinesCommand` to fetch all available baselines.
- Searches for the `IdentityCenterBaseline` in the list and retrieves its ARN.

### List Enabled Identity Center Baseline ARN:
- Uses `ListEnabledBaselinesCommand` with a filter to check if the `IdentityCenterBaseline` is enabled.
- Retrieves the ARN of the enabled baseline if it exists.

### Describe Organizational Unit:
- Uses `DescribeOrganizationalUnitCommand` with the OU ID to fetch details of the OU.
- Retrieves the ARN of the specified OU.

### List AWS Control Tower Baseline ARN:
- Uses `ListBaselinesCommand` to fetch all available baselines.
- Searches for the `AWSControlTowerBaseline` in the list and retrieves its ARN.

### Check if AWS Control Tower Baseline is Enabled and Reset if Necessary:
- Uses `ListEnabledBaselinesCommand` with a filter to check if the `AWSControlTowerBaseline` is enabled for the specified OU.
- If the baseline is enabled, uses `ResetEnabledBaselineCommand` to reset it.
- If the baseline is not enabled, uses `EnableBaselineCommand` to enable it with the specified version and parameters.

### `serverless.yml`
 
This file configures the Serverless Framework to deploy the Lambda functions and define their events.
 
#### Configuration:

- **Service**: Defines the service name.

- **Plugins**: Lists plugins used by the service.

- **Framework Version**: Specifies the version of the Serverless Framework.

- **Provider**: Configures the AWS provider, including runtime, region, and timeout.

- **Functions**: Defines the Lambda functions and their respective handlers, roles, and events.
 
## Setup and Deployment
 
1. **Install Serverless Framework**: Ensure you have the Serverless Framework installed.

   ```sh

   npm install -g serverless

2. **Deploy the Service**: Use the Serverless Framework to deploy the service.
    
    ```sh

    serverless deploy