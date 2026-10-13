from fastapi import APIRouter, Depends
from ..loader import ProjectData, get_data

router = APIRouter()


def _build_tree(components, parent_id=None):
    children = [c for c in components if c.parent_component_id == parent_id]
    result = []
    for c in children:
        node = {
            "component_id": c.component_id,
            "component_name": c.component_name,
            "component_type": c.component_type,
            "owner_dept_id": c.owner_dept_id,
            "quantity": c.quantity,
            "unit_cost_inr": c.unit_cost_inr,
            "governing_task_id": c.governing_task_id,
            "status": c.status,
            "children": _build_tree(components, c.component_id),
        }
        result.append(node)
    return result


@router.get("/components")
def get_components(data: ProjectData = Depends(get_data)) -> dict:
    tree = _build_tree(data.components, parent_id=None)
    return {"tree": tree, "total": len(data.components)}


@router.get("/components/dependencies")
def get_component_dependencies(data: ProjectData = Depends(get_data)) -> dict:
    comp_map = {c.component_id: c for c in data.components}
    nodes = [
        {
            "id": c.component_id,
            "label": c.component_name,
            "type": c.component_type,
            "status": c.status,
            "dept_id": c.owner_dept_id,
        }
        for c in data.components
    ]
    edges = [
        {
            "source": dep.component_id,
            "target": dep.depends_on_component_id,
            "dependency_type": dep.dependency_type,
        }
        for dep in data.component_dependencies
        if dep.component_id in comp_map and dep.depends_on_component_id in comp_map
    ]
    return {"nodes": nodes, "edges": edges}
