import { FeatureFlag } from '../dev-utils/feature-flag'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { EndpointsToolbar } from './frame'
import { OREntityCombobox } from './or-entity-combobox'
import { useEndpoints } from './provider'

export function EndpointsControls() {
  const { cellBorder, setCellBorder } = useEndpoints()

  return (
    <EndpointsToolbar>
      <OREntityCombobox />
      <Button
        variant="outline"
        // disabled={!selectedEntity}
        // onClick={() => setSelectedEntity('')}
      >
        Clear
      </Button>

      <FeatureFlag flag="dev">
        <Label className="flex items-center gap-2 text-xs">
          Cell Borders
          <Checkbox
            checked={cellBorder}
            onCheckedChange={(checked) => setCellBorder?.(checked === true)}
            title="Toggle cell borders"
          />
        </Label>
      </FeatureFlag>
    </EndpointsToolbar>
  )
}
