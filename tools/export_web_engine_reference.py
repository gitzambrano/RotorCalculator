"""Export Python golden cases for the web; same geometry as compiled B4A gate."""
import json
from pathlib import Path
import zBET
from verify_engine import make_geometry
FIELDS = ['CT','CQ','CQi','CQ0','CH','CHi','CH0','CY','CMx','CMy','CPair','lambda','lambda_i','FoM']
rows=[]
for pg in [False,True]:
    g=make_geometry(pg=pg,tip_loss='fixed');pitch=zBET._operating_pitch(g,12,2,4)
    for mu in [0,.05,.15,.25,.35]:
        for z in [-.02,-.01,0,.01,.02]:
            for model in ['uniform','coleman_simple','coleman_feingold','drees']:
                r=zBET.coefficients(mu=mu,mu_z=z,pitch_input=pitch,geometry=g,model=model,profile_drag_model='numerical_vectorial',induced_torque_model='energy_balance',k_ind=1.15)
                rows.append({'pg':pg,'mu':mu,'z':z,'model':model,'expected':{k:r[k] for k in FIELDS}})
Path('web/src/engine-reference.json').write_text(json.dumps(rows),encoding='utf-8')
rows=[]
g=make_geometry(pg=True,tip_loss='fixed');pitch=zBET._operating_pitch(g,12,2,4)
for mu,z in [(0,0),(.15,0),(.15,.01)]:
    baseline=zBET.coefficients(mu=mu,mu_z=z,pitch_input=pitch,geometry=g,model='coleman_feingold',profile_drag_model='numerical_vectorial',induced_torque_model='energy_balance',k_ind=1.15)
    for pair in ['rpm_collective','rpm_ct','rpm_thrust','collective_ct','collective_thrust','ct_thrust']:
        sol=zBET.solve_operating_pair(g,pair=pair,rpm=430,collective_deg=4,target_ct=baseline['CT'],target_thrust_n=baseline['T_N'],theta_root_deg=12,theta_tip_deg=2,horizontal_mode='mu',horizontal_value=mu,axial_mode='muz',axial_value=z,inflow_model='coleman_feingold',k_ind=1.15)
        rows.append({'mu':mu,'z':z,'pair':pair,'ct':baseline['CT'],'thrust':baseline['T_N'],'rpm':sol['rpm'],'collective':sol['collective_deg'],'expected':{k:sol['results'][k] for k in FIELDS}})
Path('web/src/operating-reference.json').write_text(json.dumps(rows),encoding='utf-8')
print('Exported 200 coefficients and 18 operating-pair cases')
