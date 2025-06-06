# Cantonese Style Translator

Cantonese Style Translator is a web application designed to translate colloquial/verbal Cantonese into formal, written Traditional Chinese. A key feature of this application is its ability to learn and adapt to a desired translation style by using user-provided examples. This allows for more nuanced and contextually appropriate translations than a generic translator might offer.

The application utilizes the Google Gemini API for its core translation capabilities.

Developed with assistance from Google's AI.

## Sample Application view
https://cantonese-style-translator-773247673742.us-west1.run.app/

## Features

- **Style-Guided Translation:** Provide examples of Cantonese and their corresponding Traditional Chinese translations to guide the API in matching your desired style.
- **Sentence-Level Breakdown:** Input Cantonese text is split into sentences, translated, and displayed alongside the original for easy comparison and editing.
- **Editable Translations:** Modify the translated Traditional Chinese for individual sentences directly in the UI.
- **Example Management:**
  - Manually add, edit, and delete translation examples.
  - Import examples from a CSV file (columns: `Cantonese`, `Trad. Chinese`).
  - Export current examples to a CSV file.
  - Add translated sentence pairs directly to your examples list.
- **Persistent Examples:** Your translation examples are saved in the browser's local storage.
- **Copy Full Translation:** Easily copy the complete, combined Traditional Chinese output.
- **Responsive Design:** Usable across different screen sizes.

## Technology Stack

- **Frontend:** React, TypeScript
- **Styling:** Tailwind CSS
- **AI/Translation:** Google Gemini API (`@google/genai`)
- **Modals:** `react-modal`
- **Build/Dev:** Vite (implicitly, based on common React project setup - adapt if different)

## Setup and Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A valid **Google Gemini API Key**.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd cantonese-style-translator
    ```

2.  **Install dependencies:**
    Using npm:

    ```bash
    npm install
    ```

    Or using yarn:

    ```bash
    yarn install
    ```

3.  **Set up your API Key:**
    The application requires a Google Gemini API key to function. This key **must** be provided as an environment variable named `API_KEY`.

    - Create a file named `.env` in the root of your project.
    - Add your API key to this file:
      ```env
      API_KEY=YOUR_GEMINI_API_KEY
      ```
    - **Important:** Replace `YOUR_GEMINI_API_KEY` with your actual API key.
    - **Do not commit the `.env` file to your repository.** Ensure `.env` is listed in your `.gitignore` file. The application is designed to read this key from the environment at runtime.

4.  **Start the development server:**
    Using npm:

    ```bash
    npm run dev
    ```

    Or using yarn:

    ```bash
    yarn dev
    ```

    (Assuming you have a `dev` script in your `package.json` like `vite` or `react-scripts start`. If your start command is different, please adjust.)

    The application should now be running, typically at `http://localhost:5173` or `http://localhost:3000`.

## How to Use

### 1. Manage Examples (Optional but Recommended)

Good examples significantly improve the translation quality and style.

- Navigate to the "Manage Examples" page by clicking the **Settings/Gear icon** in the header.
- **Add Manually:** Click "Add New" and fill in the Cantonese and its corresponding Formal Traditional Chinese translation.
- **Import CSV:**
  - Prepare a CSV file with two columns: `Cantonese` and `Trad. Chinese`.
  - The first row must be the header.
  - Click "Upload CSV File" in the "Import Examples from CSV" section and select your file.
  - Existing examples will be replaced by those in the CSV.
- **Export CSV:** Click "Download All" to save your current examples to a `translation_examples.csv` file.
- **Edit/Delete:** Use the icons next to each example in the list.
- **Clear All:** Remove all examples.

### 2. Translate Text

- Navigate to the main translator page (default view, or by clicking the Settings/Gear icon if on the examples page).
- **Enter Cantonese:** Type or paste your verbal Cantonese text into the main input area.
- **Click Translate:** Press the "Translate to Formal Traditional Chinese" button.
- **Review Output:**
  - **Full Combined Translation:** A read-only text area shows the complete translation. You can copy this using the "Copy Full Translation" button.
  - **Sentence Breakdown:** Below, a table displays the original Cantonese sentences alongside their editable Traditional Chinese translations.
    - **Edit:** You can directly modify the text in the "Editable Formal Traditional Chinese" column for any sentence.
    - **Add to Examples:** Click the "Add" button (plus icon) next to a sentence pair to add it to your style examples. This is useful for refining future translations.
  - **Add All to Examples:** If you have multiple valid sentence pairs displayed, you can click "Add All to Examples" to add all of them to your style guide.

### Notes

- The application uses sentence markers `[S:N]` internally when communicating with the API. You do not need to add these yourself.
- Translation quality depends heavily on the Gemini API's capabilities and the quality/quantity of your provided examples.
- If you encounter API errors, ensure your API key is correct and has not exceeded its quota.

## Error Handling

- The app provides feedback for API errors (e.g., invalid API key, quota exceeded).
- CSV parsing errors are also reported.

## Contributing

## License

MIT License.

---

This README provides a comprehensive overview. Feel free to adapt it further to your needs!
