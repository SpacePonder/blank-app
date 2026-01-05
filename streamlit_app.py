import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(layout="wide")

# Read the HTML file
with open('pomodoro.html', 'r') as f:
    html_content = f.read()

# Render the HTML component
# Height adjusted for the new "snug" layout.
# 600px should be enough for the max-w-md container + padding
components.html(html_content, height=800, scrolling=True)
