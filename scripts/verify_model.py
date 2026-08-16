import pandas as pd
import requests

def test_predictions():
    df = pd.read_csv('datasets/chest_xray_manifest.csv')
    normal_samples = df[(df['split'] == 'test') & (df['label'] == 'NORMAL')]['filepath'].head(5).tolist()
    pneu_samples = df[(df['split'] == 'test') & (df['label'] == 'PNEUMONIA')]['filepath'].head(5).tolist()

    print('==================================================')
    print(' VERIFYING 5 REAL NORMAL TEST SAMPLES')
    print('==================================================')
    for p in normal_samples:
        filename = p.replace('\\', '/').split('/')[-1]
        with open(p, 'rb') as f:
            res = requests.post('http://127.0.0.1:8000/predict/chest', files={'file': f}).json()
            pred = res.get('prediction', 'ERR')
            conf = res.get('confidence', 0.0) * 100
            probs = res.get('probabilities', {})
            norm_p = probs.get('NORMAL', 0.0) * 100
            pneu_p = probs.get('PNEUMONIA', 0.0) * 100
            print(f'File: {filename:<30} -> Result: {pred:<10} (Confidence: {conf:5.1f}%) [Normal: {norm_p:5.1f}%, Pneumonia: {pneu_p:5.1f}%]')

    print('\n==================================================')
    print(' VERIFYING 5 REAL PNEUMONIA TEST SAMPLES')
    print('==================================================')
    for p in pneu_samples:
        filename = p.replace('\\', '/').split('/')[-1]
        with open(p, 'rb') as f:
            res = requests.post('http://127.0.0.1:8000/predict/chest', files={'file': f}).json()
            pred = res.get('prediction', 'ERR')
            conf = res.get('confidence', 0.0) * 100
            probs = res.get('probabilities', {})
            norm_p = probs.get('NORMAL', 0.0) * 100
            pneu_p = probs.get('PNEUMONIA', 0.0) * 100
            print(f'File: {filename:<30} -> Result: {pred:<10} (Confidence: {conf:5.1f}%) [Normal: {norm_p:5.1f}%, Pneumonia: {pneu_p:5.1f}%]')

if __name__ == '__main__':
    test_predictions()
