# Smart Exam Platform

A modern, interactive exam platform with instant feedback and detailed explanations.

## Features

- 16 pre-built exams covering various subjects
- Upload custom markdown exam files
- AI template for generating new exams
- Customizable color themes
- Progress tracking and detailed results
- Responsive design for all devices

## Files Structure

```
NewMock/
├── index.html          # Main HTML file
├── style.css           # Styling
├── script.js           # JavaScript functionality
├── exam-data.js        # Embedded exam data
└── README.md          # This file
```

## How to Use Locally

1. **Open the application:**
   - Simply double-click `index.html` to open in your browser
   - Or right-click and select "Open with" your preferred browser

2. **Start taking exams:**
   - Choose from 16 pre-built exams in the dropdown
   - Or upload your own markdown (.md) exam files
   - Or use the AI template to generate new exams

## How to Deploy to GitHub Pages

1. **Create a new GitHub repository:**
   - Go to GitHub and create a new repository
   - Name it whatever you like (e.g., "smart-exam-platform")

2. **Upload your files:**
   - Upload all files (`index.html`, `style.css`, `script.js`, `exam-data.js`) to the repository
   - Make sure the main file is named `index.html`

3. **Enable GitHub Pages:**
   - Go to your repository settings
   - Scroll down to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"

4. **Access your site:**
   - Your site will be available at: `https://yourusername.github.io/repository-name`
   - It may take a few minutes to become active

## Creating Custom Exams

### Using the AI Template

1. Click "📋 Copy AI Template" button
2. Paste into ChatGPT, Claude, or any AI assistant
3. Replace `[Your Topic Here]` with your desired subject
4. Save the generated content as a `.md` file
5. Upload to the platform

### Manual Creation

Create a markdown file with this structure:

```markdown
# Your Exam Title

## Section A: Multiple Choice (20 Marks)

1. Your question here?
   a) Option A
   b) Option B
   c) Option C
   d) Option D

2. Another question?
   a) Option A
   b) Option B
   c) Option C
   d) Option D

---

# Answers

## Section A
1. a) Correct option || **Explanation:** Why this is correct
2. b) Correct option || **Explanation:** Why this is correct
```

## Customization

- Click the 🎨 button to customize colors
- Choose from preset themes or create your own
- Settings are saved automatically

## Browser Compatibility

- Works in all modern browsers
- Chrome, Firefox, Safari, Edge
- Mobile responsive design

## Troubleshooting

- **Exam not loading:** Check that your markdown file follows the correct format
- **Styles not working:** Ensure all files are in the same folder
- **JavaScript errors:** Check browser console for specific error messages

## Support

If you encounter any issues:
1. Check that all files are in the same directory
2. Ensure you're using a modern web browser
3. Check browser console for error messages
4. Make sure internet connection is available (for fonts)
