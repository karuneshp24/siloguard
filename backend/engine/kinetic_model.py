"""
engine/kinetic_model.py
Implements the fungal kinetic model:
  Af    = max(1.0, (T/20)^1.8 * (RH/60)^2.2 * (1 + (CO2-400)/1000))
  S_rem = 720 / Af
"""
from dataclasses import dataclass


@dataclass
class KineticResult:
    af: float          # Fungal Acceleration Factor (dimensionless)
    s_rem: float       # Safe Storage Remaining (hours)
    t_core: float      # Deep-core temperature used
    rh_core: float     # Deep-core relative humidity used
    co2_ppm: float     # CO₂ concentration used
    risk_level: str    # "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"


def _risk_level(s_rem: float) -> str:
    if s_rem >= 200:
        return "LOW"
    elif s_rem >= 150:
        return "MEDIUM"
    elif s_rem >= 48:
        return "HIGH"
    return "CRITICAL"


def compute_kinetics(t_core: float, rh_core: float, co2_ppm: float) -> KineticResult:
    """
    Compute the fungal acceleration factor and remaining safe storage.

    Parameters
    ----------
    t_core  : Deep-core temperature (°C)
    rh_core : Deep-core relative humidity (%)
    co2_ppm : CO₂ concentration (ppm)

    Returns
    -------
    KineticResult dataclass
    """
    t_factor   = (t_core / 20.0) ** 1.8
    rh_factor  = (rh_core / 60.0) ** 2.2
    co2_factor = 1.0 + (co2_ppm - 400.0) / 1000.0

    af    = max(1.0, t_factor * rh_factor * co2_factor)
    s_rem = 720.0 / af

    return KineticResult(
        af         = round(af, 4),
        s_rem      = round(s_rem, 2),
        t_core     = round(t_core, 2),
        rh_core    = round(rh_core, 2),
        co2_ppm    = round(co2_ppm, 2),
        risk_level = _risk_level(s_rem),
    )
