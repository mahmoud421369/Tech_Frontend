/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode : 'class',
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      
      fontFamily :{
        sans :['Poppins','sans-serif'],
        cairo :['Cairo','sans-serif'],

      },
      fontWeight:{
        thin: 100,
        extralight: 200,
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900,
      }
    },
  },
  plugins: [],
}