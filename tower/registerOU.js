const {
	ControlTowerClient,
	ListBaselinesCommand,
	ListEnabledBaselinesCommand,
	EnableBaselineCommand,
} = require("@aws-sdk/client-controltower")
const {
	OrganizationsClient,
	DescribeOrganizationalUnitCommand: DescribeOrganizationalUnitCommandOrg,
} = require("@aws-sdk/client-organizations")

const controltower = new ControlTowerClient({ region: "ap-south-1" })
const organizations = new OrganizationsClient({ region: "ap-south-1" })

exports.handler = async event => {
	try {
		// Step 1: List Identity Center Baseline ARN
		const identityCenterBaselineResponse = await controltower.send(
			new ListBaselinesCommand(),
		)

		console.log(
			"identityCenterBaselineResponse",
			identityCenterBaselineResponse,
		)
		let identityCenterBaselineARN
		for (const baseline of identityCenterBaselineResponse.baselines) {
			if (baseline.name === "IdentityCenterBaseline") {
				identityCenterBaselineARN = baseline.arn
				break
			}
		}

		if (!identityCenterBaselineARN) {
			throw new Error("IdentityCenterBaseline not found.")
		}

		// Step 2: List Enabled Identity Center Baseline ARN
		const enabledBaselineResponse = await controltower.send(
			new ListEnabledBaselinesCommand({
				filter: {
					baselineIdentifiers: [identityCenterBaselineARN],
				},
			}),
		)
		console.log("enabledBaselineResponse", enabledBaselineResponse)

		const enabledBaselineARN =
			enabledBaselineResponse.enabledBaselines[0].arn

		// Step 3: Describe Organizational Unit
		const ouArn = await describeOrganizationalUnit("ou-by4j-hck8bvcr")
		console.log("ouArn", ouArn)
		// Step 4: List AWS Control Tower Baseline ARN
		const awsControlTowerBaselineResponse = await controltower.send(
			new ListBaselinesCommand(),
		)

		console.log(
			"awsControlTowerBaselineResponse",
			awsControlTowerBaselineResponse,
		)

		let awsControlTowerBaselineARN
		for (const baseline of awsControlTowerBaselineResponse.baselines) {
			if (baseline.name === "AWSControlTowerBaseline") {
				awsControlTowerBaselineARN = baseline.arn
				break
			}
		}

		if (!awsControlTowerBaselineARN) {
			throw new Error("AWSControlTowerBaseline not found.")
		}
		// Step 5: Enable AWS Control Tower Baseline
		await controltower.send(
			new EnableBaselineCommand({
				baselineIdentifier: awsControlTowerBaselineARN,
				baselineVersion: "4.0",
				targetIdentifier: ouArn,
				parameters: [
					{
						key: "IdentityCenterEnabledBaselineArn",
						value: enabledBaselineARN,
					},
				],
			}),
		)

		return "Baseline enabled successfully!"
	} catch (error) {
		console.error("Error:", error)
		return "Error occurred while enabling baseline!"
	}
}

async function describeOrganizationalUnit(ouId) {
	const response = await organizations.send(
		new DescribeOrganizationalUnitCommandOrg({
			OrganizationalUnitId: ouId,
		}),
	)
	return response.OrganizationalUnit.Arn
}
