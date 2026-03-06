# Workday-Autofill
Automatically add skills in Workday job applications by interacting with the dropdown suggestion system.

The script waits for Workday's dynamically rendered dropdown suggestions and selects the correct candidate automatically.

## Why this exists
Adding skills in Workday applications is repetitive:

Each skill requires:
1. typing the skill
2. waiting for the dropdown suggestions to render
3. selecting the correct suggestion
4. repeating the process

This script automates the entire process directly in the browser.

## Installation 
The script is intended to run through **Tampermonkey**.
### 1. Install Tampermonkey
Chrome/Edge/Firefox extension
### 2. Add a new script. 
Create a new userscript and paste the code.

Or import from:
```bash
src/Workday_Skills_Autofill.js
```
## Usage
1. Open a Workday job application page
2. Navigate to the Skills section
3. Open browser console or run the Tampermonkey script
4. The script will automatically:
- type each skill
- wait for dropdown suggestions
- select the correct candidate

## Configuration
Skills need to be customized before usage, for example:
```javascript
const SKILLS = [
  "Python",
  "SQL",
  "Machine Learning",
  "Deep Learning",
  "PyTorch",
  "TensorFlow",
  "XGBoost",
  "LightGBM"
];
```
Some skills require selecting the **last dropdown candidate** instead of the first, because they are not included in workday autofills, for example:
```javascript
const USE_LAST_OPTION = [
  "XGBoost",
  "LightGBM"
];
```

## Internal Design
Workday dropdown suggestions are rendered dynamically (React).

To interact with them reliably, the script implements three mechanisms:
### Dropdown Detection
```javascript
[data-automation-id="menuItem"]
```
Only visible candidates containing a checkbox are considered valid.

### Stabilization Wait
The dropdown list is considered stable when the **candidate text signature stops changing**.
```javascript
const signature = options.map(x => (x.innerText || "").trim()).join(" || ");
```
This avoids selecting candidates before rendering completes.

### Checkbox Selection
Instead of clicking the container element, the script directly clicks the checkbox inside each candidate.
```javascript
const checkboxInput = target.querySelector('input[type="checkbox"]');
```
This ensures reliable selection.

## Project Structure
```bash
Workday-Autofill
│
├─ src
│  └─ Workday-Skills_Autofill.js
├─ .gitignore
├─ README.md
└─ LICENSE
```
## Limitations
- Works only with Workday dropdown skill fields.
- DOM structure may vary across companies.
- Future Workday updates may break selectors.

## Disclaimer
This script only interacts with the browser DOM and does not bypass authentication or access private APIs.
Use at your own discretion.
