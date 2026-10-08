from engine.telemetry import get_telemetry_snapshot
from engine.kinetic_model import compute_kinetics
from engine.automation import evaluate_automation

snap = get_telemetry_snapshot(42)
kin = compute_kinetics(
    snap['core']['temperature'],
    snap['core']['rh'],
    snap['core']['co2_ppm'],
)
evts = evaluate_automation(kin, snap['hotspot_detected'], snap['hotspot_zone'])

print("Backend OK")
print(f"  tick={snap['tick']}, voxels={len(snap['voxels'])}")
print(f"  Af={kin.af}, S_rem={kin.s_rem}h, risk={kin.risk_level}")
print(f"  events={len(evts)}")
for e in evts:
    print(f"    [{e['severity']}] {e['message']}")
