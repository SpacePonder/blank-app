import streamlit as st
import os

st.set_page_config(layout="wide", page_title="Byte Duel")

st.title("Byte Duel: Tactical Data War")
st.write("Click inside the game area to focus. Controls: `1`, `2`, `3` to switch weapons. Mouse to move and shoot.")

def get_file_content(filename):
    with open(filename, 'r') as f:
        return f.read()

try:
    css_content = get_file_content('style.css')
    js_content = get_file_content('game.js')

    # We reconstruct the HTML to embed CSS and JS because Streamlit components
    # run in an iframe and might not serve local relative static files easily
    # without extra config.
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
        {css_content}
        /* Adjust body to fit in iframe */
        body {{
            background-color: transparent;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }}
        </style>
    </head>
    <body>
        <div id="ui-container">
            <header id="ui-header">
                <div class="stats">INTEGRITY: <span id="pIntegrity">0</span> BITS</div>
                <div class="weapon-indicators">
                    <div id="wep1" class="weapon-indicator active-weapon">[1] MGUN</div>
                    <div id="wep2" class="weapon-indicator">[2] BOMB</div>
                    <div id="wep3" class="weapon-indicator">[3] SHIELD</div>
                </div>
                <div id="score">SCORE: 0</div>
                <div class="stats" style="color: #ff0000;">REMOTE PROCESS: <span id="eIntegrity">0</span></div>
            </header>
            <div id="canvas-wrapper">
                <canvas id="gameCanvas" width="900" height="500"></canvas>
                <div id="game-over">
                    <h1 id="status-text">STRING NULLIFIED</h1>
                    <p id="sub-text">Connection Lost.</p>
                    <button onclick="location.reload()">RE-INSTANTIATE</button>
                </div>
            </div>
        </div>
        <script>
        {js_content}
        </script>
    </body>
    </html>
    """

    st.components.v1.html(html_content, height=600, width=950)

except FileNotFoundError as e:
    st.error(f"Error loading game files: {e}")
