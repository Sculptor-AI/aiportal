# Customization

The AI Portal offers extensive customization options, allowing users to personalize the application's appearance and behavior to suit their preferences and workflow. This enhances user comfort and productivity by tailoring the environment to individual needs.

## 1. Implementation Details

Customization settings are primarily managed by a dedicated frontend component and are persisted either locally or to the user's account.

### Frontend (`NewSettingsPanel.jsx`)

The `NewSettingsPanel.jsx` component is the central hub for all customization options. It provides a user-friendly interface where users can adjust various settings. This component is responsible for:

*   **Displaying Options:** Presenting all available customization choices in an organized manner.
*   **Handling User Input:** Capturing user selections and changes to settings.
*   **Applying Changes:** Triggering updates to the application's UI or behavior based on the new settings.

### Data Persistence

Customization settings are saved using one of two methods:

*   **User Account (if logged in):** If a user is logged into their AI Portal account, their settings are saved to the backend database. This ensures that their preferences are synchronized across different devices and sessions.
*   **`localStorage` (otherwise):** For users who are not logged in, settings are saved locally in the browser's `localStorage`. This provides persistence for guest users but means settings will not be available on other devices or if the browser's local storage is cleared.

## 2. Core Functionality

### 2.1. Themes

Users can choose from a wide array of visual themes to change the overall look and feel of the application. The AI Portal offers **over 15 different color themes**, allowing users to select a scheme that is most comfortable or aesthetically pleasing to them. This includes options for both light and dark modes, as well as various accent colors.

### 2.2. Font Settings

To improve readability and accessibility, users can adjust font-related settings:

*   **Font Size:** Modify the size of the text throughout the application.
*   **Font Family:** Select from a predefined list of font families to change the typeface used.

### 2.3. Behavioral Settings

Beyond aesthetics, users can also configure certain behavioral aspects of the application to better suit their interaction style:

*   **"Send with Enter"**: Toggle whether pressing the Enter key in the chat input field sends the message or creates a new line.
*   **Message Alignment**: Adjust the alignment of chat messages (e.g., left-aligned, right-aligned).
*   **Other Interaction Preferences**: Additional settings may be available to fine-tune how the application responds to user input and displays information.

By providing these extensive customization options, the AI Portal aims to create a highly personalized and efficient environment for every user.