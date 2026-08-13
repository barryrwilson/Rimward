"""Ship faction skin package. Exports SKINS keyed by faction id."""

from .veridian import SKIN as _s_veridian
from .ferrous import SKIN as _s_ferrous
from .freehold import SKIN as _s_freehold
from .redledger import SKIN as _s_redledger
from .gilded import SKIN as _s_gilded
from .beautiful import SKIN as _s_beautiful
from .unknowables import SKIN as _s_unknowables
from .assembly import SKIN as _s_assembly
from .congregation import SKIN as _s_congregation
from .lamplighter import SKIN as _s_lamplighter
from .independent import SKIN as _s_independent
from .hollow import SKIN as _s_hollow

SKINS = {
    s['id']: s for s in (
        _s_veridian, _s_ferrous, _s_freehold, _s_redledger,
        _s_gilded, _s_beautiful, _s_unknowables, _s_assembly,
        _s_congregation, _s_lamplighter, _s_independent, _s_hollow,
    )
}

__all__ = ['SKINS']
