import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import requests
import json
import os
from typing import Dict, Any, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
API_URL = "http://localhost:8000"
LLM_URL = "http://localhost:8001"
AGENT_URL = "http://localhost:8002"

class Dashboard:
    def __init__(self):
        self.setup_page()
        self.initialize_session_state()

    def setup_page(self):
        st.set_page_config(
            page_title="TerraFusion Enterprise",
            page_icon="⚡",
            layout="wide",
            initial_sidebar_state="expanded"
        )

    def initialize_session_state(self):
        if "authenticated" not in st.session_state:
            st.session_state.authenticated = False
        if "user_role" not in st.session_state:
            st.session_state.user_role = None

    def login(self):
        st.title("TerraFusion Enterprise Login")
        
        with st.form("login_form"):
            username = st.text_input("Username")
            password = st.text_input("Password", type="password")
            submit = st.form_submit_button("Login")
            
            if submit:
                if self.authenticate(username, password):
                    st.session_state.authenticated = True
                    st.session_state.user_role = "admin"  # In production, get from auth service
                    st.experimental_rerun()
                else:
                    st.error("Invalid credentials")

    def authenticate(self, username: str, password: str) -> bool:
        # In production, implement proper authentication
        return username == "admin" and password == "changeme"

    def main_dashboard(self):
        st.title("TerraFusion Enterprise Dashboard")
        
        # Sidebar
        with st.sidebar:
            st.header("Navigation")
            page = st.radio(
                "Select Page",
                ["Overview", "AI Agents", "LLM", "Monitoring", "Settings"]
            )
            
            st.header("System Status")
            self.display_system_status()
        
        # Main content
        if page == "Overview":
            self.overview_page()
        elif page == "AI Agents":
            self.agents_page()
        elif page == "LLM":
            self.llm_page()
        elif page == "Monitoring":
            self.monitoring_page()
        elif page == "Settings":
            self.settings_page()

    def display_system_status(self):
        try:
            response = requests.get(f"{API_URL}/health")
            if response.status_code == 200:
                st.success("System Healthy")
            else:
                st.error("System Issues Detected")
        except:
            st.error("Cannot Connect to System")

    def overview_page(self):
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("System Metrics")
            self.display_system_metrics()
        
        with col2:
            st.subheader("Recent Activity")
            self.display_recent_activity()
        
        st.subheader("Performance Trends")
        self.display_performance_trends()

    def display_system_metrics(self):
        metrics = {
            "CPU Usage": 45,
            "Memory Usage": 60,
            "Active Agents": 12,
            "LLM Queries": 150
        }
        
        for metric, value in metrics.items():
            st.metric(metric, f"{value}%")

    def display_recent_activity(self):
        activities = [
            {"time": "2 minutes ago", "action": "Agent deployed", "status": "success"},
            {"time": "5 minutes ago", "action": "LLM model updated", "status": "success"},
            {"time": "10 minutes ago", "action": "System backup", "status": "success"}
        ]
        
        for activity in activities:
            st.info(f"{activity['time']}: {activity['action']}")

    def display_performance_trends(self):
        dates = pd.date_range(start="2024-01-01", end="2024-01-31", freq="D")
        data = pd.DataFrame({
            "date": dates,
            "performance": np.random.normal(80, 5, len(dates)),
            "efficiency": np.random.normal(75, 5, len(dates))
        })
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=data["date"], y=data["performance"], name="Performance"))
        fig.add_trace(go.Scatter(x=data["date"], y=data["efficiency"], name="Efficiency"))
        
        st.plotly_chart(fig)

    def agents_page(self):
        st.subheader("AI Agent Management")
        
        # Agent status
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Active Agents", "12")
        with col2:
            st.metric("Available Agents", "20")
        with col3:
            st.metric("Failed Agents", "0")
        
        # Agent list
        st.subheader("Agent List")
        agents = [
            {"name": "Data Processor", "status": "active", "tasks": 5},
            {"name": "Security Monitor", "status": "active", "tasks": 3},
            {"name": "Performance Optimizer", "status": "idle", "tasks": 0}
        ]
        
        for agent in agents:
            with st.expander(f"{agent['name']} ({agent['status']})"):
                st.write(f"Tasks: {agent['tasks']}")
                if st.button("View Details", key=agent['name']):
                    self.show_agent_details(agent)

    def llm_page(self):
        st.subheader("LLM Management")
        
        # Model status
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Active Models", "3")
        with col2:
            st.metric("Total Queries", "1,234")
        
        # Model management
        st.subheader("Model Management")
        models = [
            {"name": "GPT-4", "status": "active", "size": "1.5TB"},
            {"name": "BERT", "status": "active", "size": "500GB"},
            {"name": "T5", "status": "training", "size": "750GB"}
        ]
        
        for model in models:
            with st.expander(f"{model['name']} ({model['status']})"):
                st.write(f"Size: {model['size']}")
                if st.button("Manage", key=model['name']):
                    self.show_model_details(model)

    def monitoring_page(self):
        st.subheader("System Monitoring")
        
        # Real-time metrics
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("CPU", "45%", "2%")
        with col2:
            st.metric("Memory", "60%", "5%")
        with col3:
            st.metric("Disk", "75%", "1%")
        with col4:
            st.metric("Network", "30%", "3%")
        
        # Alerts
        st.subheader("Active Alerts")
        alerts = [
            {"level": "warning", "message": "High memory usage detected"},
            {"level": "info", "message": "System backup completed"},
            {"level": "error", "message": "Agent connection lost"}
        ]
        
        for alert in alerts:
            if alert["level"] == "error":
                st.error(alert["message"])
            elif alert["level"] == "warning":
                st.warning(alert["message"])
            else:
                st.info(alert["message"])

    def settings_page(self):
        st.subheader("System Settings")
        
        # General settings
        with st.expander("General Settings"):
            st.text_input("System Name", value="TerraFusion Enterprise")
            st.number_input("Max Agents", value=20)
            st.number_input("Max LLM Queries", value=1000)
        
        # Security settings
        with st.expander("Security Settings"):
            st.checkbox("Enable 2FA")
            st.checkbox("Enable Audit Logging")
            st.checkbox("Enable Auto Backup")
        
        # Notification settings
        with st.expander("Notification Settings"):
            st.checkbox("Email Notifications")
            st.checkbox("SMS Notifications")
            st.checkbox("Desktop Notifications")
        
        if st.button("Save Settings"):
            st.success("Settings saved successfully!")

    def run(self):
        if not st.session_state.authenticated:
            self.login()
        else:
            self.main_dashboard()

if __name__ == "__main__":
    dashboard = Dashboard()
    dashboard.run() 