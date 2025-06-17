// Retrieves file and returns as json object
async function retrieveFile(filePath) {
	try {
		const response = await fetch(filePath);

		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		// Returns file contents in a json format
		return await response.json();
	} catch (error) {
		console.error("There was a problem with the fetch operation:", error);
		return null;
	}
}

function isMultiSelect(obj) {
	for (const key in obj) {
	  if (typeof obj[key] !== 'boolean') {
		return false;
	  }
	}
	return true; // Returns true if all values are booleans
}

// Convert from dictionary to array
function getSelectedOptions(options) {
  let selectedOptions = [];

  for (let key in options) {
	  if(options[key]) {
		  selectedOptions.push(key);
	  }
  }
  return selectedOptions;
}

// Populates fields with form data
function populateObject(data, schema) {
	let reorderedObject = {}

	// Array of fields following proper order of fields in schema
	const fields = Object.keys(schema.properties.items);

	for (const key of fields) {
		let value = data[key];

		// Adjusts value accordingly if multi-select field
		if((typeof value === "object" && isMultiSelect(value))) {
			value = getSelectedOptions(value);
		}

		reorderedObject[key] = value;
	}

	return reorderedObject;
}

async function populateUnsdgJson(data) {
	const filePath = "schemas/input.json";

	// Retrieves schema with fields in correct order
	const schema = await retrieveFile(filePath);
	let unsdgJson = {};

	// Populates fields with form data
	if (schema) {
		unsdgJson = populateObject(data, schema);
	} else {
		console.error("Failed to retrieve JSON data.");
	}

	return unsdgJson;
}

// Creates code.json object
async function createUnsdgJson(data) {
	delete data.submit;
	const jsonData = await populateUnsdgJson(data);

	const jsonString = JSON.stringify(jsonData, null, 2);
	document.getElementById("json-result").value = jsonString;
}

// Copies code.json to clipboard
async function copyToClipboard(event){
	event.preventDefault();

	var textArea = document.getElementById("json-result");
    textArea.select();
	document.execCommand("copy")
}

// Triggers email(mailtolink)
async function emailFile(event) {
	event.preventDefault();

	const codeJson = document.getElementById("json-result").value
	const jsonObject = JSON.parse(codeJson);
	
    try {
        const cleanData = {...jsonObject};
        delete cleanData.submit;

        const jsonString = JSON.stringify(cleanData, null, 2);

        const subject = "unsdg.json Generator Results";
        const body = `Hello,\n\nHere are the unsdg.json results:\n\n${jsonString}\n\nThank you!`;

        const recipients = ["unsdg@chaoss.community"];

        const mailtoLink = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        window.location.href = mailtoLink;

        console.log("Email client opened");
    } catch {
        console.error("Error preparing email:", error);
        showNotificationModal("Error preparing email. Please try again or copy the data manually.", 'error');
    }
}

// Triggers local file download
async function downloadFile(event) {
	event.preventDefault();

	const codeJson = document.getElementById("json-result").value
	const jsonObject = JSON.parse(codeJson);
	const jsonString = JSON.stringify(jsonObject, null, 2);
	const blob = new Blob([jsonString], { type: "application/json" });

	// Create anchor element and create download link
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "unsdg.json";

	// Trigger the download
	link.click();
}

window.downloadFile = downloadFile;
window.copyToClipboard = copyToClipboard;
window.emailFile = emailFile;
window.createUnsdgJson = createUnsdgJson