import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as ex
import streamlit as st
from datetime import datetime

# import key datasets to plot

# two sub-Alpine forests in Nagano, Japan
# data imported from https://www.biodic.go.jp/moni1000/
@st.cache_data
def load_data():
    df_KY = pd.read_csv('Kayanodaira.csv')
    df_OT = pd.read_csv('Otanomosu.csv')
    return df_KY, df_OT

df_KY, df_OT = load_data()

# sidebar to select pages
add_sidebar = st.sidebar.selectbox('', ('Data dashboard','About this project'))

if add_sidebar == 'Data dashboard':
    st.write('Data dashboard')
if add_sidebar == 'About this project':
    st.write('About this project')