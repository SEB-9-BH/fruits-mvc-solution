# CarbonSense IoT Application: Complete Student Guide

## 🎯 **Project Overview**

**CarbonSense** is a full-stack IoT application for chemical and petrochemical industries to track carbon emissions, energy consumption, and sustainability KPIs in real-time. The platform integrates IoT sensor data via MQTT, provides interactive dashboards, and generates automated sustainability reports.

**Key Learning Goals:**
- Build a full-stack IoT application
- Implement MQTT real-time data integration
- Create interactive dashboards with Chart.js
- Master MVC architecture with Express
- Implement role-based authentication

---

## 🚀 **Step 1: Project Setup**

### **1.1 Install Dependencies**

```bash
# Core dependencies
npm install express mongoose dotenv jsx-view-engine method-override morgan bcrypt jsonwebtoken

# MQTT dependencies
npm install mqtt mqtt-packet

# Chart dependencies
npm install chart.js chartjs-adapter-date-fns

# Development dependencies
npm install --save-dev jest supertest mongodb-memory-server artillery@1.7.9
```

### **1.2 Environment Configuration**

**`.env`**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/carbonsense
JWT_SECRET=your-secret-key-here
MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
MQTT_CLIENT_ID=carbonsense_client
```

---

## 🗄️ **Step 2: Database Models**

### **2.1 User Model (`models/user.js`)**

```javascript
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, required: true, enum: ['Engineer', 'Manager', 'Admin'], default: 'Engineer' },
  department: { type: String, required: true, trim: true },
  plants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }]
}, { timestamps: true })

userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  return user
}

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8)
  }
  next()
})

userSchema.methods.generateAuthToken = async function() {
  const token = jwt.sign({ _id: this._id, role: this.role }, process.env.JWT_SECRET)
  return token
}

const User = mongoose.model('User', userSchema)
module.exports = User
```

### **2.2 Equipment Model (`models/equipment.js`)**

```javascript
const mongoose = require('mongoose')

const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ['Reactor', 'Compressor', 'Pump', 'Heat Exchanger', 'Turbine', 'Sensor', 'Other'] },
  plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  location: { type: String, required: true, trim: true },
  manufacturer: { type: String, trim: true },
  model: { type: String, trim: true },
  installationDate: { type: Date, default: Date.now },
  lastMaintenance: { type: Date, default: Date.now },
  nextMaintenance: { type: Date, required: true },
  status: { type: String, required: true, enum: ['Operational', 'Maintenance', 'Offline', 'Warning'], default: 'Operational' },
  mqttTopic: { type: String, required: true, unique: true, trim: true },
  readings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reading' }],
  maintenanceLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MaintenanceLog' }]
}, { timestamps: true })

const Equipment = mongoose.model('Equipment', equipmentSchema)
module.exports = Equipment
```

### **2.3 Reading Model (`models/reading.js`)**

```javascript
const mongoose = require('mongoose')

const readingSchema = new mongoose.Schema({
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  energyConsumption: { type: Number, required: true, min: 0 },
  carbonEmissions: { type: Number, required: true, min: 0 },
  waterUsage: { type: Number, required: true, min: 0 },
  temperature: { type: Number, required: true },
  pressure: { type: Number, required: true },
  flowRate: { type: Number, required: true, min: 0 },
  efficiency: { type: Number, required: true, min: 0, max: 100 },
  source: { type: String, required: true, enum: ['Manual', 'MQTT', 'API'], default: 'Manual' },
  mqttTopic: { type: String, trim: true },
  notes: { type: String, trim: true }
}, { timestamps: true })

readingSchema.index({ equipment: 1, timestamp: -1 })
readingSchema.index({ timestamp: -1 })

const Reading = mongoose.model('Reading', readingSchema)
module.exports = Reading
```

---

## 🔌 **Step 3: MQTT Integration (Core Feature)**

### **3.1 MQTT Service (`services/mqttService.js`)**

```javascript
const mqtt = require('mqtt')
const Reading = require('../models/reading')
const Equipment = require('../models/equipment')

class MQTTService {
  constructor() {
    this.client = null
    this.isConnected = false
    this.subscribedTopics = new Set()
  }

  async connect() {
    try {
      this.client = mqtt.connect(process.env.MQTT_BROKER_URL, {
        clientId: process.env.MQTT_CLIENT_ID,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000
      })

      this.client.on('connect', () => {
        console.log('✅ Connected to MQTT broker')
        this.isConnected = true
        this.subscribeToAllEquipment()
      })

      this.client.on('message', async (topic, message) => {
        await this.handleMessage(topic, message)
      })

      this.client.on('error', (error) => {
        console.error('❌ MQTT Error:', error)
        this.isConnected = false
      })

    } catch (error) {
      console.error('❌ MQTT Connection failed:', error)
    }
  }

  async subscribeToAllEquipment() {
    try {
      const equipment = await Equipment.find({})
      equipment.forEach(equipment => {
        this.subscribeToTopic(equipment.mqttTopic)
      })
    } catch (error) {
      console.error('❌ Error subscribing to equipment topics:', error)
    }
  }

  subscribeToTopic(topic) {
    if (!this.isConnected || this.subscribedTopics.has(topic)) {
      return
    }

    this.client.subscribe(topic, (error) => {
      if (error) {
        console.error(`❌ Error subscribing to ${topic}:`, error)
      } else {
        console.log(`📡 Subscribed to ${topic}`)
        this.subscribedTopics.add(topic)
      }
    })
  }

  async handleMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString())
      console.log(`📨 Received MQTT message from ${topic}:`, data)

      const equipment = await Equipment.findOne({ mqttTopic: topic })
      if (!equipment) {
        console.warn(`⚠️ No equipment found for topic: ${topic}`)
        return
      }

      const reading = new Reading({
        equipment: equipment._id,
        energyConsumption: data.energyConsumption || 0,
        carbonEmissions: data.carbonEmissions || 0,
        waterUsage: data.waterUsage || 0,
        temperature: data.temperature || 0,
        pressure: data.pressure || 0,
        flowRate: data.flowRate || 0,
        efficiency: data.efficiency || 0,
        source: 'MQTT',
        mqttTopic: topic,
        notes: 'Automatically ingested via MQTT'
      })

      await reading.save()
      console.log(`✅ Saved reading for equipment: ${equipment.name}`)

    } catch (error) {
      console.error('❌ Error handling MQTT message:', error)
    }
  }

  publishMessage(topic, message) {
    if (!this.isConnected) {
      console.warn('⚠️ MQTT not connected')
      return
    }

    this.client.publish(topic, JSON.stringify(message), (error) => {
      if (error) {
        console.error(`❌ Error publishing to ${topic}:`, error)
      } else {
        console.log(`📤 Published to ${topic}`)
      }
    })
  }

  disconnect() {
    if (this.client) {
      this.client.end()
      this.isConnected = false
    }
  }
}

module.exports = new MQTTService()
```

### **3.2 MQTT Controller (`controllers/mqtt/mqttController.js`)**

```javascript
const mqttService = require('../../services/mqttService')
const Equipment = require('../../models/equipment')

exports.simulateMQTTData = async (req, res) => {
  try {
    const { equipmentId, readings } = req.body

    const equipment = await Equipment.findById(equipmentId)
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' })
    }

    const simulatedReadings = readings || [
      {
        energyConsumption: Math.random() * 1000 + 500,
        carbonEmissions: Math.random() * 50 + 10,
        waterUsage: Math.random() * 100 + 20,
        temperature: Math.random() * 50 + 20,
        pressure: Math.random() * 10 + 1,
        flowRate: Math.random() * 200 + 50,
        efficiency: Math.random() * 30 + 70
      }
    ]

    simulatedReadings.forEach((reading, index) => {
      setTimeout(() => {
        mqttService.publishMessage(equipment.mqttTopic, reading)
      }, index * 1000)
    })

    res.json({ 
      message: `Simulated ${simulatedReadings.length} readings for ${equipment.name}`,
      equipment: equipment.name,
      topic: equipment.mqttTopic
    })

  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getMQTTStatus = (req, res) => {
  res.json({
    connected: mqttService.isConnected,
    subscribedTopics: Array.from(mqttService.subscribedTopics)
  })
}
```

---

## 🛣️ **Step 4: Controllers**

### **4.1 Reading Data Controller (`controllers/readings/dataController.js`)**

```javascript
const Reading = require('../../models/reading')
const Equipment = require('../../models/equipment')

const dataController = {}

dataController.index = async (req, res, next) => {
  try {
    const { equipmentId } = req.params
    const { limit = 100, startDate, endDate } = req.query

    const filter = { equipment: equipmentId }
    
    if (startDate && endDate) {
      filter.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    res.locals.data.readings = await Reading.find(filter)
      .populate('equipment', 'name type')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))

    next()
  } catch(error) {
    res.status(400).send({ message: error.message })
  }
}

dataController.create = async (req, res, next) => {
  try {
    req.body.equipment = req.params.equipmentId
    res.locals.data.reading = await Reading.create(req.body)
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

dataController.getDashboardData = async (req, res, next) => {
  try {
    const { plantId } = req.params
    
    const equipment = await Equipment.find({ plant: plantId })
    const equipmentIds = equipment.map(eq => eq._id)

    const latestReadings = await Reading.aggregate([
      { $match: { equipment: { $in: equipmentIds } } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$equipment', latestReading: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$latestReading' } }
    ])

    const totals = latestReadings.reduce((acc, reading) => {
      acc.energyConsumption += reading.energyConsumption || 0
      acc.carbonEmissions += reading.carbonEmissions || 0
      acc.waterUsage += reading.waterUsage || 0
      return acc
    }, { energyConsumption: 0, carbonEmissions: 0, waterUsage: 0 })

    res.locals.data.dashboardData = {
      equipment: equipment,
      readings: latestReadings,
      totals: totals
    }

    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

module.exports = dataController
```

---

## 🎨 **Step 5: Dashboard Views**

### **5.1 Dashboard Layout (`views/dashboard/Dashboard.jsx`)**

```javascript
const React = require('react')
const Layout = require('../layouts/Layout')

function Dashboard(props) {
  const { dashboardData } = props
  const { equipment, readings, totals } = dashboardData

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>CarbonSense Dashboard</h1>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            🔄 Refresh Data
          </button>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="card">
            <h3>Total Energy Consumption</h3>
            <p className="metric">{totals.energyConsumption.toFixed(2)} kWh</p>
          </div>
          <div className="card">
            <h3>Total Carbon Emissions</h3>
            <p className="metric">{totals.carbonEmissions.toFixed(2)} kg CO2</p>
          </div>
          <div className="card">
            <h3>Total Water Usage</h3>
            <p className="metric">{totals.waterUsage.toFixed(2)} L</p>
          </div>
          <div className="card">
            <h3>Active Equipment</h3>
            <p className="metric">{equipment.length}</p>
          </div>
        </div>

        {/* Equipment Status */}
        <div className="equipment-status">
          <h2>Equipment Status</h2>
          <div className="equipment-grid">
            {equipment.map(eq => {
              const reading = readings.find(r => r.equipment.toString() === eq._id.toString())
              return (
                <div key={eq._id} className={`equipment-card ${eq.status.toLowerCase()}`}>
                  <h3>{eq.name}</h3>
                  <p className="equipment-type">{eq.type}</p>
                  <p className="equipment-status">{eq.status}</p>
                  {reading && (
                    <div className="reading-data">
                      <p>Temp: {reading.temperature}°C</p>
                      <p>Pressure: {reading.pressure} bar</p>
                      <p>Efficiency: {reading.efficiency}%</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Charts */}
        <div className="charts-section">
          <h2>Real-Time Metrics</h2>
          <div className="charts-grid">
            <div className="chart-container">
              <canvas id="energyChart"></canvas>
            </div>
            <div className="chart-container">
              <canvas id="emissionsChart"></canvas>
            </div>
          </div>
        </div>

        {/* MQTT Status */}
        <div className="mqtt-status">
          <h2>MQTT Connection Status</h2>
          <div id="mqttStatus" className="status-indicator">
            Loading...
          </div>
        </div>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script src="/js/dashboard-charts.js"></script>
      <script src="/js/mqtt-status.js"></script>
    </Layout>
  )
}

module.exports = Dashboard
```

### **5.2 Dashboard Charts JavaScript (`public/js/dashboard-charts.js`)**

```javascript
document.addEventListener('DOMContentLoaded', function() {
  initializeCharts()
})

function initializeCharts() {
  const energyCtx = document.getElementById('energyChart')
  if (energyCtx) {
    new Chart(energyCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Energy Consumption (kWh)',
          data: [],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Energy Consumption Over Time'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }

  const emissionsCtx = document.getElementById('emissionsChart')
  if (emissionsCtx) {
    new Chart(emissionsCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Carbon Emissions (kg CO2)',
          data: [],
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Carbon Emissions by Equipment'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }
}
```

### **5.3 MQTT Status JavaScript (`public/js/mqtt-status.js`)**

```javascript
async function checkMQTTStatus() {
  try {
    const response = await fetch('/api/mqtt/status')
    const status = await response.json()
    
    const statusElement = document.getElementById('mqttStatus')
    if (statusElement) {
      if (status.connected) {
        statusElement.innerHTML = `
          <div class="status-connected">
            ✅ Connected to MQTT Broker
            <br>
            <small>Subscribed to ${status.subscribedTopics.length} topics</small>
          </div>
        `
      } else {
        statusElement.innerHTML = `
          <div class="status-disconnected">
            ❌ Disconnected from MQTT Broker
          </div>
        `
      }
    }
  } catch (error) {
    console.error('Error checking MQTT status:', error)
  }
}

setInterval(checkMQTTStatus, 5000)
checkMQTTStatus()
```

---

## 🚀 **Step 6: Application Setup**

### **6.1 App Configuration (`app.js`)**

```javascript
const express = require('express')
const morgan = require('morgan')
const jsxEngine = require('jsx-view-engine')
const methodOverride = require('method-override')
const mqttService = require('./services/mqttService')

const userRoutes = require('./controllers/auth/routeController')
const equipmentRoutes = require('./controllers/equipment/routeController')
const readingRoutes = require('./controllers/readings/routeController')
const mqttRoutes = require('./controllers/mqtt/routeController')
const apiRoutes = require('./routes/apiRoutes')

const app = express()

app.set('view engine', 'jsx')
app.engine('jsx', jsxEngine())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use((req, res, next) => {
    res.locals.data = {}
    next()
})
app.use(express.static('public'))
app.use(morgan('dev'))

// Web routes
app.use('/users', userRoutes)
app.use('/equipment', equipmentRoutes)
app.use('/readings', readingRoutes)
app.use('/mqtt', mqttRoutes)

// API routes
app.use('/api', apiRoutes)

// Dashboard route
app.get('/dashboard', (req, res) => {
    res.redirect('/dashboard/overview')
})

// Home route
app.get('/', (req, res) => {
    res.redirect('/dashboard')
})

module.exports = app
```

### **6.2 Server (`server.js`)**

```javascript
require('dotenv').config()
const app = require('./app')
const mqttService = require('./services/mqttService')
require('./models/db')

const PORT = process.env.PORT || 3000

// Start MQTT service
mqttService.connect()

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...')
  mqttService.disconnect()
  process.exit(0)
})

app.listen(PORT, () => {
    console.log(`🚀 CarbonSense server running on port ${PORT}`)
    console.log(`📡 MQTT connecting to ${process.env.MQTT_BROKER_URL}`)
})
```

---

## 📋 **Step 7: Final Steps**

### **7.1 Environment Setup**

```bash
# Create .env file
echo "PORT=3000
MONGODB_URI=mongodb://localhost:27017/carbonsense
JWT_SECRET=your-super-secret-key-here
MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
MQTT_CLIENT_ID=carbonsense_client" > .env
```

### **7.2 Start Development**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

---

## 🎯 **Project Checklist**

### **Core Features:**
- [ ] User authentication with role-based access
- [ ] Equipment management with MQTT topics
- [ ] MQTT real-time data integration
- [ ] Interactive dashboard with charts
- [ ] Reading data collection and storage
- [ ] Real-time MQTT status monitoring

### **Advanced Features (Optional):**
- [ ] Real-time alerts and notifications
- [ ] Predictive maintenance algorithms
- [ ] Advanced analytics and insights
- [ ] Mobile app integration
- [ ] API for external systems

### **Testing:**
- [ ] User API tests
- [ ] Equipment API tests
- [ ] MQTT integration tests
- [ ] Dashboard functionality tests

---

## 🚨 **MQTT-Specific Issues & Solutions**

### **MQTT Connection Issues:**
```bash
# Check MQTT broker status
ping broker.hivemq.com

# Test MQTT connection
mosquitto_pub -h broker.hivemq.com -t test/topic -m "test message"
```

### **MQTT Data Issues:**
- Check MQTT topic subscriptions
- Verify message format (JSON)
- Monitor MQTT connection status
- Ensure equipment has valid MQTT topics

### **Chart.js Issues:**
- Ensure Chart.js is loaded before using
- Check browser console for JavaScript errors
- Verify data format for charts

---

## 📚 **Next Steps**

1. **Add Real-time Alerts**: Implement threshold-based notifications
2. **Add Predictive Analytics**: Implement ML models for maintenance prediction
3. **Add Mobile Dashboard**: Create React Native mobile app
4. **Add Advanced Reporting**: Implement PDF/CSV export with charts
5. **Add User Management**: Implement role-based permissions
6. **Add API Integration**: Connect with external IoT platforms

This guide provides a complete foundation for building the CarbonSense IoT application with MQTT integration. The MQTT integration is the core feature that enables real-time data collection from IoT sensors! 