# **App Name**: CognitoAI

## Core Features:

- Firebase Authentication: Secure user authentication with Firebase, including signup and login pages with gradient backgrounds and personalized greetings.
- AI Chat Assistant: Interactive chat interface where users can upload files (PDF, Image) and send messages. The AI tool should incorporate user files to provide informed responses. Use smooth animations and a glassmorphism theme.
- Report Upload and Analysis: Drag-and-drop file uploader to Firebase Storage for report management. Display uploaded reports in a grid with 'View' and 'Analyze' buttons.
- Medication Reminder: Form for users to set medication reminders, including name, phone number, message, and time. API call triggered to send the reminder, with confirmation modal and history list.
- Dashboard: Central dashboard with shortcuts to Chat, Reports, Reminders, and Profile, featuring a responsive grid layout and language/theme toggle.
- Multilingual Support: Enable multilingual support with a language toggle button (English/Hindi) that dynamically switches all text using a JSON dictionary.
- Dark/Light Mode Switcher: Implement a smooth theme transition between light and dark modes, each with its own color scheme.

## Style Guidelines:

- Primary color: Blue (#2563EB), evoking trust and intelligence, as well as aligning with the request for a calm design.
- Background color: Light blue (#E0F7FA), a heavily desaturated shade of the primary color to achieve the 'soft white-blue gradient' and glassmorphism style requested by the user for light mode, while ensuring readability and not drawing too much attention.
- Accent color: Purple (#6D28D9), analogous to blue on the color wheel, for use in highlights and calls to action in a sophisticated way that will differentiate it from the primary color.
- Body and headline font: 'Poppins' (sans-serif) for a contemporary and readable design. Note: currently only Google Fonts are supported.
- Use Lucide Icons for a clean and modern look.
- Employ rounded-2xl elements, glass panels, and soft shadows to create a modern, calm, and futuristic UI.
- Utilize Framer Motion for fade, hover, and slide transitions, enhancing the user experience.