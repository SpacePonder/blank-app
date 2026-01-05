import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(layout="wide", page_title="POMODORO OS", page_icon="🍅")

with open("pomodoro.html", "r") as f:
    html_content = f.read()

components.html(html_content, height=800, scrolling=True)
