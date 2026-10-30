
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100

$scenes = @(
    @{ Name = "scene1.wav"; Text = "Across the world, millions of tons of harvested food grain are lost inside massive storage silos. The real threat is not external. It is an unseen enemy deep inside the grain core. Heat spots and moisture multiply fungal spores seventy two hours before visible signs appear. Meet SiloGuard, the software defined agritech digital twin." },
    @{ Name = "scene2.wav"; Text = "SiloGuard transforms conventional grain silos into intelligent cyber-physical digital twins. Powered by seventy five multi depth sensors mapped across surface, mid, and deep core zones, SiloGuard monitors micro climates voxel by voxel with zero blind spots. Operators can zoom smoothly into individual voxel layers with crisp precision." },
    @{ Name = "scene3.wav"; Text = "Our biological kinetic model computes fungal acceleration and safe storage time remaining in real time. When thermal runaway is detected, SiloGuard triggers autonomous defense: turbo aeration fans engage, acoustic alarms sound, and life saving voice alerts broadcast in English, Tamil, and Hindi." },
    @{ Name = "scene4.wav"; Text = "Zero lag. The farmer immediately receives an emergency alert directly on their mobile phone, with WhatsApp, cellular SMS, and instant push notifications to target number 8220480281. Simultaneously, SiloGuard launches a dynamic liquidation auction to rescue grain capital before spoilage occurs." },
    @{ Name = "scene5.wav"; Text = "What happens to unsalvageable grain? With SiloGuard, nothing goes to waste. The compromised forty percent is automatically diverted into an anaerobic bio reactor. Through controlled methanogenesis, damaged grain is converted into seventy four percent pure biomethane, generating four hundred and eighteen kilowatts of clean electricity." },
    @{ Name = "scene6.wav"; Text = "Sixty percent food grain preserved for human consumption. Forty percent salvage converted into clean renewable energy. SiloGuard: Preserving our harvest, powering our future." }
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
