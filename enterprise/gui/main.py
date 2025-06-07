import sys
import os
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLabel, QStackedWidget, QTableWidget, QTableWidgetItem,
    QProgressBar, QLineEdit, QComboBox, QMessageBox, QSystemTrayIcon,
    QMenu, QStatusBar
)
from PyQt6.QtCore import Qt, QTimer, QThread, pyqtSignal
from PyQt6.QtGui import QIcon, QAction, QFont
import psutil
import json
import logging
from datetime import datetime
from typing import Dict, Any, List
import threading
import queue

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SystemMonitor(QThread):
    update_signal = pyqtSignal(dict)
    
    def __init__(self):
        super().__init__()
        self.running = True
        
    def run(self):
        while self.running:
            metrics = {
                "cpu": psutil.cpu_percent(),
                "memory": psutil.virtual_memory().percent,
                "disk": psutil.disk_usage('/').percent,
                "network": psutil.net_io_counters()
            }
            self.update_signal.emit(metrics)
            self.msleep(1000)
    
    def stop(self):
        self.running = False

class TerraFusionGUI(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("TerraFusion Enterprise")
        self.setMinimumSize(1200, 800)
        
        # Initialize components
        self.init_ui()
        self.init_system_tray()
        self.init_monitoring()
        
        # Load configuration
        self.load_config()
        
        # Start monitoring
        self.monitor_thread.start()
    
    def init_ui(self):
        # Create central widget and layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)
        
        # Create menu bar
        self.create_menu_bar()
        
        # Create status bar
        self.statusBar = QStatusBar()
        self.setStatusBar(self.statusBar)
        self.statusBar.showMessage("System Ready")
        
        # Create main content area
        self.content_stack = QStackedWidget()
        layout.addWidget(self.content_stack)
        
        # Create pages
        self.create_dashboard_page()
        self.create_agents_page()
        self.create_llm_page()
        self.create_settings_page()
        
        # Create navigation buttons
        nav_layout = QHBoxLayout()
        self.create_nav_buttons(nav_layout)
        layout.addLayout(nav_layout)
    
    def create_menu_bar(self):
        menubar = self.menuBar()
        
        # File menu
        file_menu = menubar.addMenu("File")
        exit_action = QAction("Exit", self)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        # View menu
        view_menu = menubar.addMenu("View")
        dashboard_action = QAction("Dashboard", self)
        dashboard_action.triggered.connect(lambda: self.content_stack.setCurrentIndex(0))
        view_menu.addAction(dashboard_action)
        
        # Help menu
        help_menu = menubar.addMenu("Help")
        about_action = QAction("About", self)
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)
    
    def create_nav_buttons(self, layout):
        buttons = [
            ("Dashboard", 0),
            ("AI Agents", 1),
            ("LLM", 2),
            ("Settings", 3)
        ]
        
        for text, index in buttons:
            btn = QPushButton(text)
            btn.clicked.connect(lambda checked, idx=index: self.content_stack.setCurrentIndex(idx))
            layout.addWidget(btn)
    
    def create_dashboard_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        
        # System metrics
        metrics_layout = QHBoxLayout()
        self.cpu_label = QLabel("CPU: 0%")
        self.memory_label = QLabel("Memory: 0%")
        self.disk_label = QLabel("Disk: 0%")
        metrics_layout.addWidget(self.cpu_label)
        metrics_layout.addWidget(self.memory_label)
        metrics_layout.addWidget(self.disk_label)
        layout.addLayout(metrics_layout)
        
        # Progress bars
        self.cpu_bar = QProgressBar()
        self.memory_bar = QProgressBar()
        self.disk_bar = QProgressBar()
        layout.addWidget(self.cpu_bar)
        layout.addWidget(self.memory_bar)
        layout.addWidget(self.disk_bar)
        
        # Recent activity
        activity_label = QLabel("Recent Activity")
        activity_label.setFont(QFont("Arial", 12, QFont.Weight.Bold))
        layout.addWidget(activity_label)
        
        self.activity_table = QTableWidget()
        self.activity_table.setColumnCount(3)
        self.activity_table.setHorizontalHeaderLabels(["Time", "Event", "Status"])
        layout.addWidget(self.activity_table)
        
        self.content_stack.addWidget(page)
    
    def create_agents_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        
        # Agent controls
        controls_layout = QHBoxLayout()
        start_all_btn = QPushButton("Start All Agents")
        stop_all_btn = QPushButton("Stop All Agents")
        controls_layout.addWidget(start_all_btn)
        controls_layout.addWidget(stop_all_btn)
        layout.addLayout(controls_layout)
        
        # Agent table
        self.agent_table = QTableWidget()
        self.agent_table.setColumnCount(4)
        self.agent_table.setHorizontalHeaderLabels(["Agent", "Status", "Tasks", "Actions"])
        layout.addWidget(self.agent_table)
        
        self.content_stack.addWidget(page)
    
    def create_llm_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        
        # Model selection
        model_layout = QHBoxLayout()
        model_label = QLabel("Select Model:")
        self.model_combo = QComboBox()
        self.model_combo.addItems(["GPT-2", "BERT", "T5"])
        model_layout.addWidget(model_label)
        model_layout.addWidget(self.model_combo)
        layout.addLayout(model_layout)
        
        # Model controls
        controls_layout = QHBoxLayout()
        load_btn = QPushButton("Load Model")
        train_btn = QPushButton("Train Model")
        controls_layout.addWidget(load_btn)
        controls_layout.addWidget(train_btn)
        layout.addLayout(controls_layout)
        
        # Model status
        self.model_status = QLabel("No model loaded")
        layout.addWidget(self.model_status)
        
        self.content_stack.addWidget(page)
    
    def create_settings_page(self):
        page = QWidget()
        layout = QVBoxLayout(page)
        
        # System settings
        settings_group = QWidget()
        settings_layout = QVBoxLayout(settings_group)
        
        # Resource limits
        limits_layout = QHBoxLayout()
        cpu_limit = QLineEdit()
        cpu_limit.setPlaceholderText("CPU Limit (%)")
        memory_limit = QLineEdit()
        memory_limit.setPlaceholderText("Memory Limit (GB)")
        limits_layout.addWidget(cpu_limit)
        limits_layout.addWidget(memory_limit)
        settings_layout.addLayout(limits_layout)
        
        # Security settings
        security_layout = QHBoxLayout()
        enable_2fa = QPushButton("Enable 2FA")
        enable_audit = QPushButton("Enable Audit Logging")
        security_layout.addWidget(enable_2fa)
        security_layout.addWidget(enable_audit)
        settings_layout.addLayout(security_layout)
        
        layout.addWidget(settings_group)
        
        # Save button
        save_btn = QPushButton("Save Settings")
        layout.addWidget(save_btn)
        
        self.content_stack.addWidget(page)
    
    def init_system_tray(self):
        self.tray_icon = QSystemTrayIcon(self)
        self.tray_icon.setIcon(QIcon("icon.png"))
        
        # Create tray menu
        tray_menu = QMenu()
        show_action = QAction("Show", self)
        show_action.triggered.connect(self.show)
        quit_action = QAction("Quit", self)
        quit_action.triggered.connect(self.close)
        tray_menu.addAction(show_action)
        tray_menu.addAction(quit_action)
        
        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.show()
    
    def init_monitoring(self):
        self.monitor_thread = SystemMonitor()
        self.monitor_thread.update_signal.connect(self.update_metrics)
    
    def update_metrics(self, metrics: Dict[str, Any]):
        # Update CPU
        self.cpu_label.setText(f"CPU: {metrics['cpu']}%")
        self.cpu_bar.setValue(int(metrics['cpu']))
        
        # Update Memory
        self.memory_label.setText(f"Memory: {metrics['memory']}%")
        self.memory_bar.setValue(int(metrics['memory']))
        
        # Update Disk
        self.disk_label.setText(f"Disk: {metrics['disk']}%")
        self.disk_bar.setValue(int(metrics['disk']))
    
    def load_config(self):
        try:
            with open("config/config.json", "r") as f:
                self.config = json.load(f)
        except:
            self.config = {}
    
    def save_config(self):
        try:
            with open("config/config.json", "w") as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving config: {str(e)}")
    
    def show_about(self):
        QMessageBox.about(
            self,
            "About TerraFusion Enterprise",
            "TerraFusion Enterprise\nVersion 1.0.0\n\nEnterprise-grade AI system with offline capabilities."
        )
    
    def closeEvent(self, event):
        reply = QMessageBox.question(
            self,
            "Confirm Exit",
            "Are you sure you want to exit?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            self.monitor_thread.stop()
            self.monitor_thread.wait()
            event.accept()
        else:
            event.ignore()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = TerraFusionGUI()
    window.show()
    sys.exit(app.exec()) 