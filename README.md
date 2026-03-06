# Workday-Autofill
Automatically add skills in Workday job applications by interacting with the dropdown suggestion system.

The script waits for Workday's dynamically rendered dropdown suggestions and selects the correct candidate automatically.

## Why this exists
Applying to jobs on Workday often requires manually adding dozens of skills one by one.

Each skill requires:
1. typing the skill
2. waiting for the dropdown suggestions to render
3. selecting the correct suggestion
4. repeating the process

This script automates the entire process directly in the browser.

## Key Features
### Smart Dropdown Detection
Detects Workday dropdown candidates using DOM structure rather than fragile text matching.

### Rendering Wait Logic
Implements a **signature-based waiting mechanism** to ensure the dropdown suggestions are fully rendered before selection.

### Stable Candidate Selection
Supports two strategies:
- select the **first candidate**
- select the **last candidate** (useful for certain skills)

### Checkbox Interaction
Clicks the correct checkbox element inside each candidate instead of the container node.

### Fully Client-Side
Runs directly in the browser console. No server, no API, no login automation.

### Custom Skill List
Users can define their own skill array to auto-fill.

## How It Works
The script automates the Workday skill input process by:

1. Typing a skill into the input field
2. Opening the dropdown suggestion list
3. Waiting for the suggestions to render
4. Detecting all dropdown candidates (`menuItem`)
5. Selecting the correct candidate
6. Clicking the checkbox inside the candidate
7. Repeating for the next skill

Core components:

- `findDropdownOptions()`  
  Detects visible Workday dropdown candidates.

- `waitForDropdownOptions()`  
  Waits until the candidate list stabilizes using a signature check.

- `chooseSuggestionOrCommit()`  
  Selects and clicks the correct candidate.
  
To avoid race conditions caused by React rendering, the script uses a **signature-based stabilization check**.

The dropdown is considered stable when the list of candidate texts stops changing.

## Usage

1. Open a Workday job application page.
2. Open the browser console.
3. Paste the script.
4. Run the autofill function.

## Limitations
- Works only on Workday pages using the standard dropdown component.
- DOM structure may vary across companies.
- If Workday updates their frontend structure, selectors may need adjustment.

## Disclaimer
This tool interacts only with the client-side DOM of the page.
It does not bypass authentication or access any protected APIs.
Use at your own discretion.
