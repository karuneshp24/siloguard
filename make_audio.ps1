
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = -1
$synth.Volume = 100

$scenes = @(
    @{ 
        Name = "scene1.wav"; 
        Text = "Across the globe, over 1.3 billion tons of harvested grain are lost annually, with post-harvest storage losses accounting for up to thirty percent of total agricultural yields. The tragedy is that this food waste is not caused by external weather, but by invisible microscopic anomalies occurring deep within massive metal silos. When grains are compacted into thousands of tons, tiny pockets of trapped moisture generate metabolic respiration heat. This creates localized micro-climates where dangerous fungal spores, including Aspergillus flavus and Penicillium, proliferate exponentially seventy-two hours before any visible surface damage or temperature rise can be detected by conventional single-point probes. SiloGuard was engineered to eliminate this catastrophic blindspot through software-defined cyber-physical intelligence." 
    },
    @{ 
        Name = "scene2.wav"; 
        Text = "Let us examine the live SiloGuard application interface. Here on the Master Command Hub, operators and agricultural supervisors are greeted by a unified command deck. At the top, the real-time global telemetry ticker broadcasts live health metrics across all active silos. The Master Mode Switcher provides instant, single-click transitions between the sixty percent Grain Preservation Twin, the forty percent Biofuel Facility, the 3D Virtual Silo Telemetry Table, and the Split-Screen Dual Presenter View. Notice the presentation visual atmosphere controls, offering Emerald Quantum, Cyber Cyan, and Obsidian Gold display themes for high-contrast viewing under any agricultural control room conditions. Every module is synchronized over an ultra-low latency WebSocket pipeline, delivering real-time sensory data directly to the user's dashboard." 
    },
    @{ 
        Name = "scene3.wav"; 
        Text = "Now stepping directly into the sixty percent Grain Silo Digital Twin on our dashboard. Notice the seventy-five voxel multi-depth telemetry grid mapped precisely across Silo Number Four. Instead of relying on crude surface thermometers, SiloGuard distributes sensory voxels across three distinct anatomical depths: the Surface Layer, the Mid-Storage Zone, and the Deep Core Foundation. Each voxel continuously reports temperature, relative humidity, and air velocity at one Hertz. Operators have access to our centered proportional zoom controls, allowing granular inspection from fifty percent to two hundred percent zoom without distortion. Here, you see Voxel Forty-Two registering an abnormal temperature of forty-three point eight degrees Celsius, instantly isolated and flagged by our spatial clustering algorithms." 
    },
    @{ 
        Name = "scene4.wav"; 
        Text = "Underneath the telemetry grid lies SiloGuard's predictive intelligence engine. We do not simply monitor static threshold limits; we model biological degradation kinetics in real time. The fungal acceleration factor, A-f, is dynamically computed using an Arrhenius-based thermodynamic equation comparing current core temperature against baseline conditions. Simultaneously, moisture sorption isotherms calculate instantaneous water activity, a-w. This allows our predictive algorithm to forecast safe storage time remaining, S-rem, with ninety-four point eight percent accuracy. While conventional systems only sound alarms when grain is already rotting and mycotoxins are formed, SiloGuard detects fungal velocity seventy-two hours in advance, providing a decisive intervention window." 
    },
    @{ 
        Name = "scene5.wav"; 
        Text = "When thermal runaway breaches the critical stability threshold, SiloGuard transitions immediately into autonomous crisis defense. A two-minute emergency countdown sequence initiates. The system automatically activates localized Variable Frequency Drive turbo aeration fans, dynamically routing high-volume chilled airflow directly into the affected deep-core voxel to extract metabolic heat before runaway occurs. Simultaneously, the acoustic defense array triggers high-decibel audible sirens on site, while an automated speech synthesis engine broadcasts multilingual voice alerts in English, Tamil, and Hindi, ensuring local farm operators can understand and react instantly without language barriers." 
    },
    @{ 
        Name = "scene6.wav"; 
        Text = "Critical alerts are useless if they remain trapped in a control room. SiloGuard deploys an omni-channel dispatch engine designed specifically for farmers. The system immediately targets farmer mobile number 8220480281, transmitting structured emergency alerts via WhatsApp, cellular SMS, and high-priority push notifications with zero lag. Because SiloGuard is deployed permanently on GitHub's global cloud edge, farmers receive an interactive direct link that opens the digital twin immediately on any smartphone over 4G, 5G, or Wi-Fi, working twenty-four hours a day, seven days a week, three hundred and sixty-five days a year, without requiring the facility PC to remain powered on. Farmers can verify deep-core temperatures and authorize emergency measures with a single tap from their pocket." 
    },
    @{ 
        Name = "scene7.wav"; 
        Text = "What if grain has already experienced thermal degradation and cannot be safely stored for long-term reserves? Instead of facing a total financial write-off, SiloGuard launches an automated dynamic flash-auction. Connected regional flour mills, animal feed manufacturers, and food processing plants receive instant bidding notifications. The system applies an algorithmic discount model, starting at a twenty to thirty-five percent markdown, reflecting the exact biological shelf life remaining. Local commercial buyers place real-time bids to secure the grain for immediate same-day processing. This salvages agricultural capital, guarantees liquidity for the farmer, and keeps vital nutrition within the human supply chain." 
    },
    @{ 
        Name = "scene8.wav"; 
        Text = "Here is our second core pillar: the forty percent Biofuel Facility. In conventional agriculture, compromised, heavily damaged grain is discarded into toxic open dumps, releasing harmful greenhouse gases. SiloGuard implements a zero-waste circular valorization loop. Grain that cannot be rescued is automatically diverted via automated pneumatic augers into our on-site anaerobic digester. Inside the continuous stirred-tank reactor, multi-stage methanogenesis converts the starch and organic solids into clean biogas with seventy-four point two percent methane purity. The combined heat and power generator produces four hundred and eighteen kilowatts of clean electricity, feeding local rural power grids while producing pathogen-free organic bio-fertilizer." 
    },
    @{ 
        Name = "scene9.wav"; 
        Text = "Examining our 3D Virtual Silo Telemetry Table, users experience an interactive isometric wireframe of the silo structure. Every internal vertical column, cross-sectional temperature gradient, and sensor probe is visualized in true 3D space, empowering engineers to run anomaly simulations and slice-by-slice structural diagnostics. In conclusion, SiloGuard proves that post-harvest losses are entirely solvable. By combining sixty percent precision food preservation with forty percent clean energy recovery, we deliver an unprecedented closed-loop circular economy with an eight-point-four times return on investment. SiloGuard: Preserving our harvest, protecting our farmers, and powering our sustainable future." 
    }
)

$outDir = "C:\Users\Karunesh P\OneDrive\Desktop\Hack\siloguard\audio"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

foreach ($s in $scenes) {
    $filePath = Join-Path $outDir $s.Name
    $synth.SetOutputToWaveFile($filePath)
    $synth.Speak($s.Text)
    Write-Output "Generated $($s.Name) - Size: $((Get-Item $filePath).Length) bytes"
}
$synth.Dispose()
