const {
	ControlTowerClient,
	ListBaselinesCommand,
	ListEnabledBaselinesCommand,
	ResetEnabledBaselineCommand,
	EnableBaselineCommand,
} = require("@aws-sdk/client-controltower")
const {
	OrganizationsClient,
	DescribeOrganizationalUnitCommand,
} = require("@aws-sdk/client-organizations")

const controltower = new ControlTowerClient({ region: "ap-south-1" })
const organizations = new OrganizationsClient({ region: "ap-south-1" })

exports.handler = async event => {
	try {
		// Step 1: List Identity Center Baseline ARN
		const identityCenterBaselineARN = await getBaselineARN(
			"IdentityCenterBaseline",
		)
		console.log("identityCenterBaselineARN", identityCenterBaselineARN)
		if (!identityCenterBaselineARN)
			throw new Error("IdentityCenterBaseline not found.")

		// Step 2: List Enabled Identity Center Baseline ARN
		const enabledBaselineARN = await getEnabledBaselineARN(
			identityCenterBaselineARN,
		)
		console.log("enabledBaselineARN", enabledBaselineARN)

		// Step 3: Describe Organizational Unit
		const ouArn = await describeOrganizationalUnit("ou-by4j-dkgdrqt2")

		// Step 4: List AWS Control Tower Baseline ARN
		const awsControlTowerBaselineARN = await getBaselineARN(
			"AWSControlTowerBaseline",
		)
		console.log("awsControlTowerBaselineARN", awsControlTowerBaselineARN)
		if (!awsControlTowerBaselineARN)
			throw new Error("AWSControlTowerBaseline not found.")

		// Step 5: Check if AWS Control Tower Baseline is already enabled and reset if necessary
		const isBaselineEnabled = await checkIfBaselineEnabled(
			awsControlTowerBaselineARN,
			ouArn,
		)
		console.log("isBaselineEnabled", isBaselineEnabled)
		if (isBaselineEnabled) {
			const resetResponse = await resetControlTowerBaseline(
				isBaselineEnabled,
			)
			console.log("resetResponse", resetResponse)
		} else {
			const rrr = await enableControlTowerBaseline(
				awsControlTowerBaselineARN,
				"4.0",
				ouArn,
				enabledBaselineARN,
			)
			console.log("rrr", rrr)
		}
		return "Baseline enabled successfully!"
	} catch (error) {
		console.error("Error:", error)
		return `Error occurred while enabling baseline: ${error.message}`
	}
}

async function getBaselineARN(baselineName) {
	try {
		const response = await controltower.send(new ListBaselinesCommand())
		console.log("response", response)
		const baseline = response.baselines.find(b => b.name === baselineName)
		return baseline ? baseline.arn : null
	} catch (error) {
		console.error(`Error listing baselines: ${error.message}`)
		throw error
	}
}

async function getEnabledBaselineARN(baselineARN) {
	try {
		const response = await controltower.send(
			new ListEnabledBaselinesCommand({
				filter: {
					baselineIdentifiers: [baselineARN],
				},
			}),
		)
		console.log("responsess", response)

		return response.enabledBaselines.length > 0
			? response.enabledBaselines[0].arn
			: null
	} catch (error) {
		console.error(`Error listing enabled baselines: ${error.message}`)
		throw error
	}
}

async function describeOrganizationalUnit(ouId) {
	try {
		const response = await organizations.send(
			new DescribeOrganizationalUnitCommand({
				OrganizationalUnitId: ouId,
			}),
		)
		console.log("responseou", response)

		return response.OrganizationalUnit.Arn
	} catch (error) {
		console.error(`Error describing organizational unit: ${error.message}`)
		throw error
	}
}

async function checkIfBaselineEnabled(baselineARN, targetARN) {
	try {
		const response = await controltower.send(
			new ListEnabledBaselinesCommand({
				filter: {
					baselineIdentifiers: [baselineARN],
					targetIdentifier: targetARN,
				},
			}),
		)
		console.log("response4", response)
		let awsControlTowerBaselineARN11
		for (const baseline of response.enabledBaselines) {
			if (baseline.targetIdentifier === targetARN) {
				awsControlTowerBaselineARN11 = baseline.arn
				break
			}
		}
		return awsControlTowerBaselineARN11
	} catch (error) {
		console.error(`Error checking if baseline is enabled: ${error.message}`)
		throw error
	}
}

async function resetControlTowerBaseline(enabledBaselineARN) {
	try {
		const command = new ResetEnabledBaselineCommand({
			enabledBaselineIdentifier: enabledBaselineARN,
		})
		const response = await controltower.send(command)
		console.log("response5", response)

		return response.operationIdentifier
	} catch (error) {
		console.error(
			`Error resetting Control Tower baseline: ${error.message}`,
		)
		throw error
	}
}

async function enableControlTowerBaseline(
	baselineARN,
	version,
	targetARN,
	enabledBaselineARN,
) {
	try {
		await controltower.send(
			new EnableBaselineCommand({
				baselineIdentifier: baselineARN,
				baselineVersion: version,
				targetIdentifier: targetARN,
				parameters: [
					{
						key: "IdentityCenterEnabledBaselineArn",
						value: enabledBaselineARN,
					},
				],
			}),
		)
	} catch (error) {
		console.error(`Error enabling Control Tower baseline: ${error.message}`)
		throw error
	}
}
