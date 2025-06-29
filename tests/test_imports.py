import sys
import os
import pkgutil
import importlib
import pytest

# Ensure the project root is in sys.path for import resolution
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

PACKAGE = "backend.app"


def walk_modules(package):
    """Yield all modules in a package recursively."""
    for importer, modname, ispkg in pkgutil.walk_packages(
        path=importlib.import_module(package).__path__,
        prefix=package + ".",
    ):
        yield modname


@pytest.mark.parametrize("modname", list(walk_modules(PACKAGE)))
def test_import_module(modname):
    """Test that all modules can be imported without error."""
    importlib.import_module(modname)
