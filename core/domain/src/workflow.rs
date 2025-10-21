use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DelegationStrategy {
    RoundRobin,
    Random,
    Single,
}

impl DelegationStrategy {
    pub fn as_str(self) -> &'static str {
        match self {
            DelegationStrategy::RoundRobin => "round-robin",
            DelegationStrategy::Random => "random",
            DelegationStrategy::Single => "single",
        }
    }
}

impl Default for DelegationStrategy {
    fn default() -> Self {
        DelegationStrategy::RoundRobin
    }
}

impl FromStr for DelegationStrategy {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "round-robin" => Ok(DelegationStrategy::RoundRobin),
            "random" => Ok(DelegationStrategy::Random),
            "single" => Ok(DelegationStrategy::Single),
            _ => Err(()),
        }
    }
}
